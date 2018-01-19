'use strict';
/* Imports */

import {model as currentModel} from '../model/model.js';
import {mapStyle} from '../model/map-style.js';

/* Classes */

// ViewModel class utilized in Knockout.js initialization
class DisplayViewModel {
  constructor () {
    /* Instance Variables */
    const self = this;
    self.mapReady = window.ko.observable(false);
    self.query = window.ko.observable('');

    // Determine if to include local language heading in title
    if (currentModel.area.locallang) {
      self.mainTitle = `${currentModel.area.locallang} - ${currentModel.area.city} \
${currentModel.area.type} Map Guide`;
    } else {
      self.mainTitle = `${currentModel.area.city} ${currentModel.area.type} Map Guide`;
    }

    // Observable Markers Array that will determine display of list and markers
    self.markersObservable = window.ko.observableArray([]);
    // Computed observable loads markers once map initialization complete
    self.createMarkersObservable = window.ko.computed(function () {
      if (self.mapReady()) {
        self.markersObservable(GoogleMapView.markers);
        self.sort(self.markersObservable);
        return true;
      }
    }, self);

    /* Instance Methods */
    // Method to open InfoWindow using prev/next buttons
    self.clickArrow = function (direction) {
      if (self.markersObservable().length > 1) {
        const currentMarkerIndex = self.markersObservable.indexOf(GoogleMapView.mainInfoWindow.marker);
        let neighborMarkerIndex = (currentMarkerIndex + direction) % self.markersObservable().length;
        if (neighborMarkerIndex === -1) {
          neighborMarkerIndex = self.markersObservable().length - 1;
        }
        const neighborMarker = self.markersObservable()[neighborMarkerIndex];
        GoogleMapView.popInfoWindow(neighborMarker);
      }
    };

    // Filter obsrvable location list and markers based on query
    self.filterMarkerList = function (searchInput) {
      // Search query is a non-empty string
      if (searchInput) {
        // Empty the observable list
        self.markersObservable([]);
        GoogleMapView.markers.forEach(function (checkMarker) {
          // Re-add marker to observable array only if marker title match search query
          const markerTitle = checkMarker.title.toUpperCase();
          if (markerTitle.indexOf(searchInput.toUpperCase()) >= 0) {
            // Positive match between query and marker title
            self.markersObservable.push(checkMarker);
            // Check if marker not already displayed to prevent blinking due to setting map again
            if (!checkMarker.getMap()) {
              GoogleMapView.setMarkerMap(checkMarker, true);
            }
            GoogleMapView.queryBoundsExtend(checkMarker.position);
          // Marker title did not match search query, remove it from map
          } else {
            GoogleMapView.setMarkerMap(checkMarker, false);
          }
        });

        const markersLength = self.markersObservable().length;
        // Open info window if 1 marker matches search
        if (markersLength === 1) {
          if (!GoogleMapView.mainInfoWindow.marker) {
            GoogleMapView.popInfoWindow(self.markersObservable()[0]);
          }
          // Will set queryBounds to undefined, no bounds fit
          GoogleMapView.queryBoundsFit(false);

        // Else sort remaining markers after query and apply new bounds
        // only if more than 1 marker matches search
        } else if (markersLength > 1) {
          // Close InfoWindow if open on a marker
          GoogleMapView.closeInfoWindow();
          self.sort(self.markersObservable);
          // Fit query bounds
          GoogleMapView.queryBoundsFit(true);
        }

      // Search query is empty string ''
      } else {
        // Display all markers on map
        GoogleMapView.markers.forEach(function (checkMarker) {
          if (!checkMarker.getMap()) {
            GoogleMapView.setMarkerMap(checkMarker, true);
          }
        });
        // Display all list items
        self.markersObservable(GoogleMapView.markers);
        self.sort(self.markersObservable);
        self.resetMap();
      }
    };
    self.getVisibleMarkers = function () {
      return self.markersObservable();
    };

    // Observable subscription for instant filtering of query results
    self.query.subscribe(self.filterMarkerList);
  }

  // When click a location in sidebar
  clickLocationList (clickedMarker) {
    // Hide sidebar if open to display InfoWindow
    if (window.matchMedia('(max-width: 767px)').matches) {
      DisplayViewModel.instance.toggleSidebar();
    }
    GoogleMapView.popInfoWindow(clickedMarker);
  }

  // Navigate to next available marker InfoWindow in list
  clickNextArrow () {
    DisplayViewModel.instance.clickArrow(1);
  }

  // Navigate to previous available marker InfoWindow in list
  clickPrevArrow () {
    DisplayViewModel.instance.clickArrow(-1);
  }

  // Alphabetically sort display of loations by title
  sort (observableArray) {
    observableArray.sort((first, second) => {
      return first.title === second.title ? 0 : (first.title > second.title ? 1 : -1);
    });
  }

  // Called by Reset <button>
  resetMap () {
    this.query('');
    GoogleMapView.resetMap();
  }

  // Shows/hides sidebar with hamburger <button>
  toggleSidebar () {
    const listView = document.getElementsByClassName('list-view')[0];
    const state = listView.classList.contains('show-list-view');
    // Hides sidebar if open and vice versa
    if (state) {
      listView.classList.add('hide-list-view');
      listView.classList.remove('show-list-view');
    } else {
      listView.classList.remove('hide-list-view');
      listView.classList.add('show-list-view');
    }
  }
}

// Class for handling google map display/view
class GoogleMapView {
  static closeInfoWindow () {
    GoogleMapView.mainInfoWindow.close();
    GoogleMapView.mainInfoWindow.marker = undefined;
  }

  // maps.googleapis.com script initial loading error callback
  static errorLoadMap () {
    window.alert('Unable to load Google Map at this time. Check your internet connection or try again later');
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
    });

    // Declare listener callback outside of loop to avoid jshint warning
    const listenerPopInfo = function () {
      // Hide sidebar if open to display InfoWindow
      hideListView();
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

    // Notify current instance of DisplayViewModel that google map initialization is complete
    DisplayViewModel.instance.mapReady(true);

    // Helper Method for hiding sidebar if it is open
    function hideListView () {
      const listView = document.getElementsByClassName('list-view')[0];
      const state = listView.classList.contains('show-list-view');
      if (state) {
        listView.classList.add('hide-list-view');
        listView.classList.remove('show-list-view');
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
      const listView = document.getElementsByClassName('list-view')[0];
      listView.classList.remove('show-list-view');
    }
  }

  static popInfoWindow (marker) {
    // Bounce marker
    GoogleMapView.toggleBounceMarker(marker);

    // Check if InfoWindow not already on on clicked marker
    if (GoogleMapView.mainInfoWindow.marker !== marker) {
      GoogleMapView.mainInfoWindow.marker = marker;

      // Center on marker & move up map to allow for info window display
      GoogleMapView.map.panTo(marker.position);
      GoogleMapView.map.panBy(0, -280);

      // Begin construction of InfoWindow content
      let markerContent = `<div class="info-title"><strong>${marker.title}</strong></div>`;

      // Spinner HTML below taken from http://tobiasahlin.com/spinkit/
      markerContent += '<div class="sk-circle">';
      for (let circleNum = 1; circleNum <= 12; circleNum += 1) {
        markerContent += `<div class="sk-circle${circleNum} sk-child"></div>`;
      }
      markerContent += '</div>';
      // END spinner HTML injection code

      // Place title & spinner into InfoWindow & open it
      GoogleMapView.mainInfoWindow.setContent(markerContent);
      GoogleMapView.mainInfoWindow.open(GoogleMapView.map, marker);

      // Begin fetching data from Yelp
      getYelp(marker).then(yelpInfo => {
        // Only enter here if no connection issues
        if (yelpInfo) {
          // Yelp result exists
          // Remove spinner by reassigning markerContent with Yelp info
          markerContent = `<div class="info-title"><strong>${marker.title}</strong></div>`;

          // Image
          markerContent += `<img class="yelp-img" src=${yelpInfo.image_url} alt=${marker.title}>`;

          // Rating & Info
          markerContent += `<div class="yelp-container">${getRatingImg(yelpInfo.rating)}`;
          markerContent += `<a target="_blank" href="${yelpInfo.url}">`;
          markerContent += `<img class="yelp-logo" src="img/yelp_trademark_rgb_outline.png" \
srcset="img/yelp_trademark_rgb_outline_2x.png 2x" alt="Yelp Logo">`;
          markerContent += `</a>`;
          markerContent += `<a class="yelp-reviews" href="${yelpInfo.url}" target="_blank">Based \
on <strong>${yelpInfo.review_count}</strong> review${yelpInfo.review_count > 1 ? 's' : ''}</a>`;
          markerContent += `<p><address>${getYelpAddressHtml(yelpInfo.location.display_address)}\
</address></p>`;
          markerContent += `<p class="yelp-info">Currently \
<strong>${yelpInfo.is_closed ? 'CLOSED' : 'OPEN'}</strong><br>`;
          markerContent += `Phone: ${yelpInfo.display_phone}</p>`;
          markerContent += `</div>`;

          // Add previosu/next arrow buttons
          markerContent += `<div class="info-arrows">`;
          markerContent += `<a href="#" aria-role="button" class="btn info-arrows-prev" \
>&lt;</a>`;
          markerContent += `<a href="#" class="btn info-arrows-next" aria-role="button" \
>&gt;</a>`;
          markerContent += `</div>`;
          GoogleMapView.mainInfoWindow.setContent(markerContent);

          // Apply ViewModel bindings to the arrow buttons
          applyArrowBtnsBindings();

        // Result undefined, search term not in Yelp database
        } else {
          markerContent = `<div class="info-title"><strong>${marker.title}</strong></div>`;
          markerContent += `<p>This location's information is not found in Yelp's business \
directory. Try a different location.</p>`;

          // Add previosu/next arrow buttons
          markerContent += `<div class="info-arrows">`;
          markerContent += `<a href="#" aria-role="button" class="btn info-arrows-prev" \
>&lt;</a>`;
          markerContent += `<a href="#" class="btn info-arrows-next" aria-role="button" \
>&gt;</a>`;
          markerContent += `</div>`;
          GoogleMapView.mainInfoWindow.setContent(markerContent);

          // Apply ViewModel bindings to the arrow buttons
          applyArrowBtnsBindings();
        }
      })
      // In case of connection error to cors-anywhere.herokuapp.com or
      // api.yelp.com
      .catch((err) => {
        markerContent = `<div class="title"><strong>${marker.title}</strong></div>`;
        markerContent += `<p>Unable to retrieve this location's Yelp data due to a \
connection error. Please try again later.</p>`;
        GoogleMapView.mainInfoWindow.setContent(markerContent);
        console.log(err);
      });
    }

    // Helper method for applying Knockout bindings to arrow prev/next buttons
    function applyArrowBtnsBindings () {
      const arrowBtnsDiv = document.getElementsByClassName('info-arrows')[0];
      const dataBindStyle = `css: { 'btn-off': markersObservable().length < 2 }`;
      if (arrowBtnsDiv) {
        arrowBtnsDiv.children[0].setAttribute('data-bind', 'click: clickPrevArrow, ' + dataBindStyle);
        arrowBtnsDiv.children[1].setAttribute('data-bind', 'click: clickNextArrow, ' + dataBindStyle);
        window.ko.applyBindings(DisplayViewModel.instance, arrowBtnsDiv);
      }
    }

    // Helper method for formatting Yelp address html string
    function getYelpAddressHtml (yelpAddress) {
      // Remove country from address since it's redundant in the context of a city map
      if (yelpAddress[yelpAddress.length - 1] === currentModel.area.country) {
        yelpAddress = yelpAddress.slice(0, yelpAddress.length - 1);
      }
      return yelpAddress.join('<br>');
    }

    // Helper method for selection and formatting of correct Yelp star rating img
    function getRatingImg (rating) {
      const ratingWhole = Math.floor(rating);
      const ratingHalf = (rating - ratingWhole === 0.5 ? '_half' : '');
      return `<img class="yelp-rating" src="img/yelp_stars_reg/regular_${ratingWhole}${ratingHalf}\
.png" srcset="img/yelp_stars_reg/regular_${ratingWhole}${ratingHalf}@2x.png 2x">`;
    }

    // Helper method for formatting search string from title
    function getSearchString (locationTitle) {
      return locationTitle.replace(/\s+/g, '+');
    }

    // Helper method for fetching Yelp info
    function getYelp (mapMarker) {
      // Since client-side requests to Yelp V3 API are not possible due to lack
      // of support for CORS and JSONP, 'cors-anywhere' app hack is employed as a proxy
      return window.fetch(`https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/\
businesses/search?term=${getSearchString(mapMarker.title)}&latitude=\
${mapMarker.position.lat()}&longitude=${mapMarker.position.lng()}`,
        {
          method: 'GET',
          headers: {
            'authorization': `Bearer ${GoogleMapView.YELP_TOKEN}`
          }
        })
        .catch(err => {
          // In case connection error to cors-anywhere.herokuapp.com
          window.alert(`Unable to retrieve this locations's Yelp data due to a \
connection error. Please try again later.`);
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
      GoogleMapView.markers.forEach(otherMarker => { otherMarker.setAnimation(undefined); });
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(undefined), 1500);
    }
  }
}

/* Initialization */

// Import model:currently from local model.js file
// TODO may implement import data from server in future
// const currentModel = Object.assign({}, model);

// Yelp service access token
GoogleMapView.YELP_TOKEN = `n9BZFWy_zC3jyQyNV9u0Tdc6IhfkwyV8b4JBg2NYD9AaQuHaUx6II9\
ukiEQp2Z03m7Cmycz29Lu2n4Gc5LPu1wDjVVCGyignkEoZn167yyq07sbPEN7gF5GzE20YWnYx`;

// Knockout.js DisplayViewModel initialization
DisplayViewModel.instance = new DisplayViewModel();
window.ko.applyBindings(DisplayViewModel.instance);
