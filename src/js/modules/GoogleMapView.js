import {mapStyle} from './mapStyle';
import {model as currentModel} from '../../model/model';
import DisplayViewModel from './DisplayViewModel';

// Class for handling google map display/view/update
class GoogleMapView {
  static closeInfoWindow () {
    GoogleMapView.mainInfoWindow.close();
    GoogleMapView.mainInfoWindow.marker = undefined;
    DisplayViewModel.instance.setSelectedMarker(undefined);
  }

  // maps.googleapis.com script initial loading error callback
  static errorLoadMap () {
    window.alert('Unable to load Google Map at this time. Check your internet connection or try again later.');
  }

  // googleapis.com initalization success callback
  static initMap () {
    // Create new map
    const mapElement = document.getElementsByClassName('map')[0];
    GoogleMapView.map = new window.google.maps.Map(mapElement, {
      // Center on city
      center: {
        lat: currentModel.area.position.lat,
        lng: currentModel.area.position.lng
      },
      zoom: 12,
      styles: mapStyle
    });

    // Recenter map on window resize
    window.onresize = GoogleMapView.onWindowResize;

    // Clicking on map while sidebar is open will hide it
    mapElement.addEventListener('click', hideListView);

    // Markers corresponding to data locations
    GoogleMapView.markers = [];
    // Map bounds
    GoogleMapView.originalBounds = new window.google.maps.LatLngBounds();

    // InfoWindow configuration
    GoogleMapView.mainInfoWindow = new window.google.maps.InfoWindow({
      maxWidth: 250
    });
    GoogleMapView.mainInfoWindow.addListener('closeclick', function () {
      GoogleMapView.mainInfoWindow.marker = undefined;
      DisplayViewModel.instance.setSelectedMarker(undefined);
    });

    // Declare listener callback outside of loop to avoid jshint warning
    const listenerPopInfo = function () {
      // Hide sidebar if open to display InfoWindow
      hideListView();
      // 'this' will be the marker inside listener cb
      GoogleMapView.popInfoWindow(this);
    };

    // Create array of Markers from provided location info
    currentModel.locations.forEach(function (location) {
      const newMarker = new window.google.maps.Marker({
        position: location.position,
        title: location.title,
        animation: window.google.maps.Animation.DROP,
        icon: 'img/icons/' + location.type + '.png',
        map: GoogleMapView.map
      });
      newMarker.addListener('click', listenerPopInfo);
      GoogleMapView.markers.push(newMarker);
      GoogleMapView.originalBounds.extend(newMarker.position);
    });

    // Adjust map bounds to fit all markers
    GoogleMapView.resetMap();

    // Notify current instance of DisplayViewModel that
    // google map initialization is complete
    DisplayViewModel.instance.mapReady(true);

    // Helper Method for hiding sidebar if it is open
    function hideListView () {
      const listView = document.getElementsByClassName('list-sidebar')[0];
      const state = listView.classList.contains('list-sidebar--show');
      if (state) {
        listView.classList.add('list-sidebar--hide');
        listView.classList.remove('list-sidebar--show');
      }
    }
  }

  static onWindowResize () {
    if (DisplayViewModel.instance) {
      // Get list of current visible markers
      const visibleMarkers = DisplayViewModel.instance.getVisibleMarkers();

      // If > 1 marker fit bounds based on all of them
      if (visibleMarkers.length > 1) {
        // If infoWindow currently open, center on info window
        if (GoogleMapView.mainInfoWindow.marker) {
          GoogleMapView.map.panTo(GoogleMapView.mainInfoWindow.marker.position);
          GoogleMapView.map.panBy(0, -280);

        // InfoWindow not open on any marker, fit bounds based on all visible markers
        } else {
          GoogleMapView.resizeBounds = new window.google.maps.LatLngBounds();
          visibleMarkers.forEach(function (markerOnMap) {
            GoogleMapView.resizeBounds.extend(markerOnMap.position);
          });
          GoogleMapView.map.fitBounds(GoogleMapView.resizeBounds);
          GoogleMapView.resizeBounds = undefined;
          if (GoogleMapView.map.getZoom() > 18) {
            GoogleMapView.map.setZoom(18);
          }
        }

      // Only 1 marker, don't extend bounds, go directly to marker
      } else if (visibleMarkers.length === 1) {
        GoogleMapView.map.panTo(visibleMarkers[0].position);
        GoogleMapView.map.panBy(0, -280);
      }
      // If no visible markers, no fitting bounds
    }

    // Slide sidebar into initial position automatically when window enlarge
    if (window.matchMedia('(min-width: 768px)').matches) {
      const listView = document.getElementsByClassName('list-sidebar')[0];
      listView.classList.remove('list-sidebar--show');
    }
  }

  static popInfoWindow (marker) {
    // Bounce marker
    GoogleMapView.toggleBounceMarker(marker);

    // Check if InfoWindow not already on clicked marker
    if (GoogleMapView.mainInfoWindow.marker !== marker) {
      GoogleMapView.mainInfoWindow.marker = marker;

      // Let DisplayViewModel know that marker has been selected
      DisplayViewModel.instance.setSelectedMarker(marker);

      // Center on marker & move up map to allow for info window display
      GoogleMapView.map.panTo(marker.position);
      GoogleMapView.map.panBy(0, -280);

      // Construction of pre-fetch InfoWindow content
      let markerContent = getInfoWindowMainHtml(getInfoWindowSpinnerHtml(), marker.title);

      // Place title & spinner into InfoWindow & open it
      GoogleMapView.mainInfoWindow.setContent(markerContent);
      GoogleMapView.mainInfoWindow.open(GoogleMapView.map, marker);

      applyArrowBtnsBindings();

      // Begin fetching data from Yelp
      getYelp(marker).then(function (yelpInfo) {
        // Only enter here if no connection issues

        // Check if InfoWindow still on requested marker, else don't render
        if (GoogleMapView.mainInfoWindow.marker === marker) {
          // Check if Yelp result exists
          if (yelpInfo) {
            // Remove spinner by reassigning markerContent with Yelp info
            markerContent = getInfoWindowMainHtml(getYelpInfoHtml(yelpInfo), marker.title);

            GoogleMapView.mainInfoWindow.setContent(markerContent);

            // Apply ViewModel bindings to the arrow buttons
            applyArrowBtnsBindings();

          // Result undefined, search term not in Yelp database
          } else {
            let notFoundHtml = `<p>This location's information is not found in Yelp's business `;
            notFoundHtml += `directory. Try a different location.</p>`;
            markerContent = getInfoWindowMainHtml(notFoundHtml, marker.title);

            GoogleMapView.mainInfoWindow.setContent(markerContent);

            // Apply ViewModel bindings to the arrow buttons
            applyArrowBtnsBindings();
          }
        }
      })
      // In case of connection error to cors-anywhere.herokuapp.com or
      // api.yelp.com
      .catch(function (err) {
        // Check if InfoWindow still on requested marker, else don't render
        if (GoogleMapView.mainInfoWindow.marker === marker) {
          let errorHtml = `<p>Unable to retrieve this location's Yelp data due to a `;
          errorHtml += `connection error. Please try again later.</p>`;
          markerContent = getInfoWindowMainHtml(errorHtml, undefined);

          GoogleMapView.mainInfoWindow.setContent(markerContent);
          console.log(err); // TODO

          // Apply ViewModel bindings to the arrow buttons
          applyArrowBtnsBindings();
        }
      });
    }

    // Helper method for applying Knockout bindings to arrow prev/next buttons
    function applyArrowBtnsBindings () {
      const arrowBtnsDiv = document.getElementsByClassName('info-window__arrows')[0];
      // Determine if buttons will be clickable
      const dataBindStyle = `css: { 'btn--off': markersObservable().length < 2 }`;
      if (arrowBtnsDiv) {
        arrowBtnsDiv.children[0]
          .setAttribute('data-bind', 'click: clickPrevArrow, ' + dataBindStyle);
        arrowBtnsDiv.children[1]
          .setAttribute('data-bind', 'click: clickNextArrow, ' + dataBindStyle);
        window.ko.applyBindings(DisplayViewModel.instance, arrowBtnsDiv);
      }
    }

    function getInfoWindowMainHtml (content, markerTitle) {
      // Helper method for constructing InfoWindow arrows HTML
      function getInfoWindowArrowsHtml () {
        let infoWindowArrows = `<div class="info-window__arrows">`;
        infoWindowArrows += `<a href="#" role="button" class="btn info-window__arrows-prev"`;
        infoWindowArrows += `>&lt;</a>`;
        infoWindowArrows += `<a href="#" class="btn info-window__arrows-next" role="button"`;
        infoWindowArrows += `>&gt;</a>`;
        infoWindowArrows += `</div>`;
        return infoWindowArrows;
      }

      let infoWindowContent = `<div class="info-window">`;
      infoWindowContent += `<div class="title"><strong>${markerTitle}</strong></div>`;

      // Insert custom content
      infoWindowContent += content;

      // Insert bottom nav arrows
      infoWindowContent += getInfoWindowArrowsHtml();
      // Close <div class="info-window">
      infoWindowContent += `</div>`;
      return infoWindowContent;
    }

    // Helper method for constructing InfoWindow spinner HTML
    function getInfoWindowSpinnerHtml () {
      let spinner = '<div class="sk-circle">';
      for (let circleNum = 1; circleNum <= 12; circleNum += 1) {
        spinner += `<div class="sk-circle${circleNum} sk-child"></div>`;
      }
      spinner += '</div>';
      return spinner;
    }

    // Helper method for selection and formatting of correct Yelp star rating img
    function getRatingImg (rating) {
      const ratingWhole = Math.floor(rating);
      const ratingHalf = (rating - ratingWhole === 0.5 ? '_half' : '');
      let imgHtml = `<img class="yelp__rating" src="img/yelp_stars_reg/regular_`;
      imgHtml += `${ratingWhole}${ratingHalf}.png" srcset="img/yelp_stars_reg/`;
      imgHtml += `regular_${ratingWhole}${ratingHalf}@2x.png 2x">`;
      return imgHtml;
    }

    // Helper method for formatting search string from title
    function getSearchString (locationTitle) {
      return locationTitle.replace(/\s+/g, '+');
    }

    // Helper method for fetching Yelp info
    function getYelp (mapMarker) {
      // Since client-side requests to Yelp V3 API are not possible due to lack
      // of support for CORS and JSONP, 'cors-anywhere' app hack is employed as a proxy
      let fetchString = `https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/`;
      fetchString += `businesses/search?term=${getSearchString(mapMarker.title)}&`;
      fetchString += `latitude=${mapMarker.position.lat()}&longitude=`;
      fetchString += `${mapMarker.position.lng()}`;

      return window.fetch(fetchString,
        {
          method: 'GET',
          headers: {
            'authorization': `Bearer ${GoogleMapView.YELP_TOKEN}`
          }
        })
        .catch(err => {
          // In case connection error to cors-anywhere.herokuapp.com
          // window.alert(`Unable to retrieve this locations's Yelp data due to a \
          // connection error. Please try again later.`); TODO
          return Promise.reject(err);
        })
        .then(response => {
          // Both cors-anywhere.herokuapp.com and api.yelp.com reachable
          if (response.ok) return response;
          // cors-anywhere.herokuapp.com ok, api.yelp.com fails
          else return Promise.reject(new Error('api.yelp.com connection error'));
        })
        .then(response => response.json())
        .then(responseJSON => responseJSON.businesses[0]);
    }

    // Helper method for formatting Yelp address html string
    function getYelpAddressHtml (yelpAddress) {
      // Remove country from address since it's redundant in the context of a city map
      if (yelpAddress[yelpAddress.length - 1] === currentModel.area.country) {
        yelpAddress = yelpAddress.slice(0, yelpAddress.length - 1);
      }
      return yelpAddress.join('<br>');
    }

    // Helper method for inserting Yelp html into info window
    function getYelpInfoHtml (yelpInfo) {
      let yelpContent = `<div class="yelp">`;
      // Image
      yelpContent += `<img class="yelp__image" src=${yelpInfo.image_url} alt="Museum">`;
      // Rating & Info
      yelpContent += `<div class="yelp__info">${getRatingImg(yelpInfo.rating)}`;
      yelpContent += `<a target="_blank" href="${yelpInfo.url}">`;
      yelpContent += `<img class="yelp__logo" src="img/yelp_trademark_rgb_outline.png" `;
      yelpContent += `srcset="img/yelp_trademark_rgb_outline_2x.png 2x" alt="Yelp Logo">`;
      yelpContent += `</a>`;
      yelpContent += `<a class="yelp__reviews" href="${yelpInfo.url}" target="_blank">Based `;
      yelpContent += `on <strong>${yelpInfo.review_count}</strong> review`;
      yelpContent += `${yelpInfo.review_count > 1 ? 's' : ''}</a>`;
      yelpContent += `<p><address>${getYelpAddressHtml(yelpInfo.location.display_address)}`;
      yelpContent += `</address></p>`;
      yelpContent += `<p class="yelp__open-now">Currently <strong>`;
      yelpContent += `${yelpInfo.is_closed ? 'CLOSED' : 'OPEN'}</strong><br>`;
      yelpContent += `Phone: ${yelpInfo.display_phone}</p>`;
      // Close <div class="yelp__info">
      yelpContent += `</div>`;
      // Close <div class="yelp">
      yelpContent += `</div>`;

      return yelpContent;
    }

  // END of method popInfoWindow(marker)
  }

  static queryBoundsExtend (markerPosition) {
    // Create new LatLngBounds object for every query
    if (!GoogleMapView.queryBounds) {
      GoogleMapView.queryBounds = new window.google.maps.LatLngBounds();
    }
    GoogleMapView.queryBounds.extend(markerPosition);
  }

  static queryBoundsFit (fitBounds) {
    if (fitBounds) {
      GoogleMapView.map.fitBounds(GoogleMapView.queryBounds);
      // Set to undefined since each query creates new queryBounds
      GoogleMapView.queryBounds = undefined;
    } else GoogleMapView.queryBounds = undefined;

    // Check for excessive zoom if bounds very small or a single marker
    if (GoogleMapView.map.getZoom() > 18) {
      GoogleMapView.map.setZoom(18);
    }
  }

  static resetMap () {
    GoogleMapView.map.fitBounds(GoogleMapView.originalBounds);
    GoogleMapView.mainInfoWindow.marker = undefined;
    GoogleMapView.mainInfoWindow.close();
    // Let DisplayViewModel know to unselect list-item
    DisplayViewModel.instance.setSelectedMarker(undefined);
  }

  static setMarkerMap (marker, set) {
    if (set) {
      marker.setMap(GoogleMapView.map);
    } else {
      marker.setMap(undefined);
    }
  }

  static toggleBounceMarker (marker) {
    if (marker.getAnimation()) {
      // If click again during animation marker, will stop
      marker.setAnimation(undefined);
    } else {
      // Disable bounce on all markers and set temporary bounce on selected marker
      GoogleMapView.markers.forEach(function (otherMarker) {
        otherMarker.setAnimation(undefined);
      });
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(undefined), 1500);
    }
  }
}

export default GoogleMapView;
