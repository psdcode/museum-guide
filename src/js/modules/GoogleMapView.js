import {mapStyle} from './mapStyle';
import KnockoutViewModel from './KnockoutViewModel';
import GoogleMapPlacesSearch from './GoogleMapPlacesSearch';
import yelp from './yelp';
import spinnerHtmlString from './spinner';
import createHash from 'hash-generator';

// Class for handling Google Map & InfoWindow display/update
class GoogleMapView {
  static closeInfoWindow () {
    GoogleMapView.mainInfoWindow.close();
    GoogleMapView.mainInfoWindow.marker = undefined;
    KnockoutViewModel.instance.setSelectedMarker(undefined);
  }

  static deleteMarkers () {
    // Reset markers
    GoogleMapView.markers.forEach(function (marker) {
      marker.setMap(undefined);
    });
    GoogleMapView.markers = [];
    KnockoutViewModel.instance.clearMarkersObservable();

    // Reset bounds
    GoogleMapView.currentBounds = new window.google.maps.LatLngBounds();
  }

  // maps.googleapis.com script initial loading error callback
  static errorLoadMap () {
    if (KnockoutViewModel.instance) {
      KnockoutViewModel.instance.notifyMapLoadFail(true);
    }
  }

  // Helper Method for hiding sidebar if it is open
  static hideListView () {
    const sidebars = document.getElementsByClassName('sidebar');
    const state = sidebars[0].classList.contains('sidebar--show');
    if (state) {
      for (const sidebar of sidebars) {
        sidebar.classList.add('sidebar--hide');
        sidebar.classList.remove('sidebar--show');
      }
    }
  }

  // googleapis.com initalization success callback
  static initMap () {
    // Create new map
    const mapElement = document.getElementsByClassName('map')[0];
    GoogleMapView.map = new window.google.maps.Map(mapElement, {
      // Center on default location
      center: {
        lat: GoogleMapView.defaultPosition.lat,
        lng: GoogleMapView.defaultPosition.lng
      },
      zoom: 12,
      styles: mapStyle
    });

    // Create Google Map places search service
    GoogleMapView.placesSearch = new GoogleMapPlacesSearch(GoogleMapView.map, GoogleMapView);

    // Inject places search loading spinner HTML
    const liveSearchLoadingDiv = document.getElementsByClassName('sidebar-list__live-search-loading')[0];
    liveSearchLoadingDiv.insertAdjacentHTML('afterbegin', spinnerHtmlString);

    // Recenter map on window resize
    window.onresize = GoogleMapView.onWindowResize;

    // Clicking on map while sidebar is open will hide it
    mapElement.addEventListener('click', GoogleMapView.hideListView);

    // Markers corresponding to data locations
    GoogleMapView.markers = [];

    // InfoWindow configuration
    GoogleMapView.mainInfoWindow = new window.google.maps.InfoWindow({
      maxWidth: 250
    });
    GoogleMapView.mainInfoWindow.addListener('closeclick', function () {
      GoogleMapView.mainInfoWindow.marker = undefined;
      KnockoutViewModel.instance.setSelectedMarker(undefined);
    });
  }

  static livePlacesSearch (cityName, latLng, searchTerm) {
    // Create hash for current search session & store it
    const searchHash = createHash(5);
    GoogleMapView.currentSearchSessionHash = searchHash;
    // Delete previous search results
    GoogleMapView.deleteMarkers();
    // Initiate Search
    GoogleMapView.placesSearch
      .livePlacesSearch(cityName, latLng, GoogleMapView.defaultType, searchTerm, searchHash);
  }

  // Load app in either 'curated' or 'liveSearch' mode
  static loadMode (modelCityObj, newMode) {
    // Mode will be undefined on initial launch
    // OR if cities don't match
    // OR if cities match AND curated is previous and new selected mode
    if (GoogleMapView.mode === undefined ||
        GoogleMapView.modelCityObj !== modelCityObj ||
        (newMode !== 'curated' || GoogleMapView.mode !== 'curated')) {
      // Clear markers
      GoogleMapView.deleteMarkers();

      // Set current model city and new mode
      GoogleMapView.modelCityObj = modelCityObj;
      GoogleMapView.mode = newMode;

      // Load curated markers if in 'curated' mode
      if (newMode === 'curated') {
        // Create array of Markers from provided location info
        GoogleMapView.loadMarkers(modelCityObj.locations);
        // Hide list view if open
        GoogleMapView.hideListView();
      }
    }

    // Adjust map bounds to fit all markers
    GoogleMapView.resetMap();
  }

  static loadMarkers (markerInfos) {
    // Add new markers
    markerInfos.forEach(function (venue) {
      const newMarker = new window.google.maps.Marker({
        position: venue.position,
        title: venue.title,
        animation: window.google.maps.Animation.DROP,
        icon: 'img/icons/' + venue.type + '.png',
        map: GoogleMapView.map
      });
      newMarker.addListener('click', function listenerPopInfo () {
        // Hide sidebar if open to display InfoWindow
        GoogleMapView.hideListView();
        // 'this' will be the marker inside listener cb
        GoogleMapView.popInfoWindow(this);
      });
      GoogleMapView.markers.push(newMarker);
      GoogleMapView.currentBounds.extend(newMarker.position);

      // When show property will be set to true css animation to show list entry
      // corresponding to marker will launch
      newMarker.show = false;
    });
    // Notify current instance of KnockoutViewModel that
    // google map and marker initialization is complete
    KnockoutViewModel.instance.markersReady('');
    KnockoutViewModel.instance.markersReady(GoogleMapView.modelCityObj.cityName);
  }

  static loadPlacesSearchResults (results, searchHash) {
    // Only load results if current search session hash match results session hash
    if (searchHash === GoogleMapView.currentSearchSessionHash) {
      // Search error: display generic error message
      if (results instanceof Error) {
        KnockoutViewModel.instance.searchPlacesCompleted('error');

      // No results
      } else if (results.length === 0) {
        KnockoutViewModel.instance.searchPlacesCompleted('noresults');

      // At least one successful returned result
      } else {
        GoogleMapView.deleteMarkers();
        GoogleMapView.loadMarkers(results);
        GoogleMapView.map.fitBounds(GoogleMapView.currentBounds);
        // Signal KnockoutViewModel search is successful and complete
        KnockoutViewModel.instance.searchPlacesCompleted('success');
      }
    }
  }

  static onWindowResize () {
    if (KnockoutViewModel.instance) {
      // Get list of current visible markers
      const visibleMarkers = KnockoutViewModel.instance.getVisibleMarkers();

      // If > 1 marker fit bounds based on all of them
      if (visibleMarkers.length > 1) {
        // If infoWindow currently open, center on info window
        if (GoogleMapView.mainInfoWindow.marker) {
          GoogleMapView.map.panTo(GoogleMapView.mainInfoWindow.marker.position);
          GoogleMapView.map.panBy(0, -340);

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
        GoogleMapView.map.panBy(0, -340);
      }
      // If no visible markers, no fitting bounds
    }

    // Slide sidebar into initial position automatically when window enlarge
    if (window.matchMedia('(min-width: 768px)').matches) {
      const sidebars = document.getElementsByClassName('sidebar');
      for (const sidebar of sidebars) {
        sidebar.classList.remove('sidebar--show');
      }
    }
  }

  static popInfoWindow (marker) {
    // Bounce marker
    GoogleMapView.toggleBounceMarker(marker);

    // Check if InfoWindow not already on clicked marker
    if (GoogleMapView.mainInfoWindow.marker !== marker) {
      GoogleMapView.mainInfoWindow.marker = marker;

      // Let KnockoutViewModel know that marker has been selected
      KnockoutViewModel.instance.setSelectedMarker(marker);

      // Center on marker & move up map to allow for info window display
      GoogleMapView.map.panTo(marker.position);
      GoogleMapView.map.panBy(0, -340);

      // Construction of pre-fetch InfoWindow content
      let markerContent = getInfoWindowMainHtml(spinnerHtmlString, marker.title);

      // Place title & spinner into InfoWindow & open it
      GoogleMapView.mainInfoWindow.setContent(markerContent);
      GoogleMapView.mainInfoWindow.open(GoogleMapView.map, marker);

      // Apply bindings to arrow btns
      applyArrowBtnsBindings();

      // Begin fetching data about current marker location from Yelp
      yelp.fetchYelpInfo(marker, GoogleMapView.corsServer).then(function (yelpInfo) {
        // Only enter here if no connection issues encountered
        // Check if InfoWindow still on requested marker, else don't render
        if (GoogleMapView.mainInfoWindow.marker === marker) {
          // Check if Yelp result exists, ie yelpInfo !== {}
          const yelpInfoIsEmptyObj = Object.keys(yelpInfo).length === 0;
          if (!yelpInfoIsEmptyObj) {
            // Remove spinner by reassigning markerContent with Yelp info
            const yelpHtml = yelp.getYelpInfoHtml(yelpInfo, GoogleMapView.modelCityObj.country);
            markerContent = getInfoWindowMainHtml(yelpHtml, marker.title);

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
      // In case of connection error to cors server or
      // api.yelp.com
        .catch(function (err) {
          // Check if InfoWindow still on requested marker, else don't render
          if (GoogleMapView.mainInfoWindow.marker === marker) {
            let errorHtml = `<p>Unable to retrieve this location's Yelp data due to a `;
            errorHtml += `connection error. Please try again later.</p>`;
            markerContent = getInfoWindowMainHtml(errorHtml, 'Loading Error');

            GoogleMapView.mainInfoWindow.setContent(markerContent);

            // Apply ViewModel bindings to the arrow buttons
            applyArrowBtnsBindings();
            return err;
          }
        });
    }

    // Helper method for applying Knockout bindings to arrow prev/next buttons
    function applyArrowBtnsBindings () {
      const arrowBtnsDiv = document.getElementsByClassName('info-window__arrows')[0];
      // Determine if buttons will be clickable
      const dataBindStyle = `css: { 'btn--disabled': markersObservable().length < 2 }`;
      if (arrowBtnsDiv) {
        arrowBtnsDiv.children[0]
          .setAttribute('data-bind', 'click: clickPrevArrow, ' + dataBindStyle);
        arrowBtnsDiv.children[1]
          .setAttribute('data-bind', 'click: clickNextArrow, ' + dataBindStyle);
        window.ko.applyBindings(KnockoutViewModel.instance, arrowBtnsDiv);
      }
    }

    function getInfoWindowMainHtml (content, markerTitle) {
      // Helper method for constructing InfoWindow arrows HTML
      function getInfoWindowArrowsHtml () {
        let infoWindowArrows = `<div class="info-window__arrows">`;
        infoWindowArrows += `<a href="#" role="button" class="btn info-window__arrows-prev"`;
        infoWindowArrows += `><span class="info-window__arrows-text">&lt;</span></a>`;
        infoWindowArrows += `<a href="#" class="btn info-window__arrows-next" role="button"`;
        infoWindowArrows += `><span class="info-window__arrows-text">&gt;</span></a>`;
        infoWindowArrows += `</div>`;
        return infoWindowArrows;
      }

      let infoWindowContent = `<div class="info-window">`;
      infoWindowContent += `<div class="info-window__title"><strong>${markerTitle}</strong></div>`;

      // Insert custom content
      infoWindowContent += content;

      // Insert bottom nav arrows
      infoWindowContent += getInfoWindowArrowsHtml();
      // Close <div class="info-window">
      infoWindowContent += `</div>`;
      return infoWindowContent;
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
    }
    // Set to undefined since each query creates new queryBounds
    GoogleMapView.queryBounds = undefined;

    // Check for excessive zoom if bounds very small or a single marker
    if (GoogleMapView.map.getZoom() > 18) {
      GoogleMapView.map.setZoom(18);
    }
  }

  static resetMap () {
    if (GoogleMapView.mode === 'curated') {
      GoogleMapView.map.fitBounds(GoogleMapView.currentBounds);
    } else if (GoogleMapView.mode === 'liveSearch') {
      GoogleMapView.currentSearchSessionHash = undefined;
      GoogleMapView.deleteMarkers();
      GoogleMapView.map.panTo(GoogleMapView.modelCityObj.position);
    }
    GoogleMapView.mainInfoWindow.marker = undefined;
    GoogleMapView.mainInfoWindow.close();
    // Let KnockoutViewModel know to unselect list-item
    KnockoutViewModel.instance.setSelectedMarker(undefined);
  }

  // Main publically accessible module
  static returnModule () {
    return {
      errorLoadMap: GoogleMapView.errorLoadMap,
      initMap: GoogleMapView.initMap
    };
  }

  static setMarkerOnMap (marker, set) {
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
      setTimeout(() => (marker.setAnimation(undefined)), 1500);
    }
  }
}

export default GoogleMapView;
