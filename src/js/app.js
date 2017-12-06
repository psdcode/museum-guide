/* Classes */

// ViewModel class utilized in Knockout.js initialization
class DisplayViewModel {
  constructor () {
    /* Instance Variables */
    const self = this;
    self.mapReady = ko.observable(false);
    self.query = ko.observable('');

    // Determine if to include local language heading in title
    if (currentModel.area.locallang) {
      self.mainTitle = `${currentModel.area.locallang} - ${currentModel.area.city} \
${currentModel.area.type} Map Guide`;
    } else {
      self.mainTitle = `${currentModel.area.city} ${currentModel.area.type} Map Guide`;
    }

    // Observable Markers Array that will determine display of list and markers
    self.markersObservable = ko.observableArray([]);
    // Computed observable loads markers once map initialization complete
    self.createMarkersObservable = ko.computed(function () {
      if (self.mapReady()) {
        self.markersObservable(GoogleMapView.markers);
        self.sort(self.markersObservable);
        return true;
      }
    }, self);

    /* Instance Methods */
    self.clickLocationList = function (clickedMarker) {
      // Hide sidebar if open to display InfoWindow
      hideListView();
      GoogleMapView.popInfoWindow(clickedMarker);
    };

    // Method to open InfoWindow using prev/next buttons
    self.clickArrow = function (direction) {
      if (self.markersObservable().length > 1) {
        const currentMarkerIndex = self.markersObservable.indexOf(GoogleMapView.mainInfoWindow.marker);
        let neighborMarkerIndex = (currentMarkerIndex + direction) % self.markersObservable().length;
        if (neighborMarkerIndex === -1) neighborMarkerIndex = self.markersObservable().length - 1;
        const neighborMarker = self.markersObservable()[neighborMarkerIndex];
        GoogleMapView.popInfoWindow(neighborMarker);
      }
    };

    self.clickPrevArrow = function () {
      self.clickArrow(-1);
    };

    self.clickNextArrow = function () {
      self.clickArrow(1);
    };

    // Filter obsrvable location list and markers based on query
    self.filterMarkerList = function (searchInput) {
      // Search query is a non-empty string
      if (searchInput) {
        // Empty the observable list
        self.markersObservable([]);
        for (const checkMarker of GoogleMapView.markers) {
          // Re-add marker to observable array only if marker title match search query
          const markerTitle = checkMarker.title.toUpperCase();
          if (markerTitle.indexOf(searchInput.toUpperCase()) >= 0) {
            // Positive match between query and marker title
            self.markersObservable.push(checkMarker);
            // Check if marker not already displayed to prevent blinking due to setting map again
            if (!checkMarker.getMap()) GoogleMapView.setMarkerMap(checkMarker, true);
            GoogleMapView.queryBoundsExtend(checkMarker.position);
          // Marker title did not match search query, remove it from map
          } else {
            GoogleMapView.setMarkerMap(checkMarker, false);
          }
        }

        const markersLength = self.markersObservable().length;
        // Open info window if 1 marker matches search
        if (markersLength === 1) {
          if (!GoogleMapView.mainInfoWindow.marker) {
            GoogleMapView.popInfoWindow(self.markersObservable()[0]);
          }
          // Will set queryBounds to null, no bounds fit
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
        for (const checkMarker of GoogleMapView.markers) {
          if (!checkMarker.getMap()) GoogleMapView.setMarkerMap(checkMarker, true);
        }
        // Display all list items
        self.markersObservable(GoogleMapView.markers);
        self.sort(self.markersObservable);
        self.resetMap();
      }
    };

    // Observable subscription for instant filtering of query results
    self.query.subscribe(self.filterMarkerList);
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
}

// Class for handling google map display/view
class GoogleMapView {
  static closeInfoWindow () {
    GoogleMapView.mainInfoWindow.close();
    GoogleMapView.mainInfoWindow.marker = null;
  }

  // maps.googleapis.com script initial loading error callback
  static errorLoadMap () {
    alert('Unable to load Google Map at this time. Check your connection or try again later');
  }

  // googleapis.com initalization success callback
  static initMap () {
    // Create new map
    GoogleMapView.map = new google.maps.Map(document.getElementsByClassName('map')[0], {
      // Center on city
      center: {
        lat: currentModel.area.position.lat,
        lng: currentModel.area.position.lng
      },
      zoom: 12
    });

    // Markers corresponding to data locations
    GoogleMapView.markers = [];
    // Map bounds
    GoogleMapView.originalBounds = new google.maps.LatLngBounds();

    // InfoWindow configuration
    GoogleMapView.mainInfoWindow = new google.maps.InfoWindow({
      maxWidth: 250
    });
    GoogleMapView.mainInfoWindow.addListener('closeclick', function () {
      GoogleMapView.mainInfoWindow.marker = null;
    });

    // Declare listener callback outside of loop to avoid jshint warning
    const listenerPopInfo = function () {
      // Hide sidebar if open to display InfoWindow
      hideListView();
      GoogleMapView.popInfoWindow(this);
    };
    // Create array of Markers from provided location info
    for (const location of currentModel.locations) {
      const newMarker = new google.maps.Marker({
        position: location.position,
        title: location.title,
        animation: google.maps.Animation.DROP,
        icon: 'data/' + location.icon,
        map: GoogleMapView.map
      });
      newMarker.addListener('click', listenerPopInfo);
      GoogleMapView.markers.push(newMarker);
      GoogleMapView.originalBounds.extend(newMarker.position);
    }

    // Adjust map bounds to fit all markers
    GoogleMapView.resetMap();

    // Notify current instance of DisplayViewModel that google map initialization is complete
    DisplayViewModel.instance.mapReady(true);
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
      for (let circleNum = 1; circleNum <= 12; circleNum++) {
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
      const dataBindStyle = `style: { cursor: markersObservable().length < 2 ? \
'not-allowed' : 'pointer', 'opacity': markersObservable().length < 2 ? \
'0.2' : '1' , 'background-color': markersObservable().length < 2 ? '#696969' : 'transparent'}`;

      if (arrowBtnsDiv) {
        arrowBtnsDiv.children[0].setAttribute('data-bind', 'click: clickPrevArrow, ' + dataBindStyle);
        arrowBtnsDiv.children[1].setAttribute('data-bind', 'click: clickNextArrow, ' + dataBindStyle);
        ko.applyBindings(DisplayViewModel.instance, arrowBtnsDiv);
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
      return fetch(`https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/\
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
      GoogleMapView.queryBounds = new google.maps.LatLngBounds();
    }
    GoogleMapView.queryBounds.extend(markerPosition);
  }

  static queryBoundsFit (fitBounds) {
    if (fitBounds) {
      GoogleMapView.map.fitBounds(GoogleMapView.queryBounds);
      GoogleMapView.queryBounds = null;
    } else GoogleMapView.queryBounds = null;
    if (GoogleMapView.map.getZoom() > 18) GoogleMapView.map.setZoom(18);
  }

  static resetMap () {
    GoogleMapView.map.fitBounds(GoogleMapView.originalBounds);
    GoogleMapView.map.panBy(0, -100);
    GoogleMapView.mainInfoWindow.marker = null;
    GoogleMapView.mainInfoWindow.close();
  }

  static setMarkerMap (marker, set) {
    if (set) marker.setMap(GoogleMapView.map);
    else marker.setMap(null);
  }

  static toggleBounceMarker (marker) {
    if (marker.getAnimation()) {
      // If click again during animation marker, will stop
      marker.setAnimation(null);
    } else {
      // Disable bounce on all markers and set temporary bounce on selected marker
      GoogleMapView.markers.forEach(otherMarker => { otherMarker.setAnimation(null); });
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 1500);
    }
  }
}

/* Initialization */

// Import model:currently from local model.js
// TODO may implement import data from server in future
const currentModel = Object.assign({}, modelToImport);

// Yelp service access token
GoogleMapView.YELP_TOKEN = `n9BZFWy_zC3jyQyNV9u0Tdc6IhfkwyV8b4JBg2NYD9AaQuHaUx6II9\
ukiEQp2Z03m7Cmycz29Lu2n4Gc5LPu1wDjVVCGyignkEoZn167yyq07sbPEN7gF5GzE20YWnYx`;

// Knockout.js DisplayViewModel initialization
DisplayViewModel.instance = new DisplayViewModel();
ko.applyBindings(DisplayViewModel.instance);

// Layout, Interface, CSS related code
window.onresize = function () {
  // Recenter map on window resize
  GoogleMapView.resetMap();
  // Slide sidebar into initial position automatically when window enlarge
  if (window.matchMedia('(min-width: 768px)').matches) {
    const listView = document.getElementsByClassName('list-view')[0];
    listView.classList.remove('show-list-view');
  }
};

// Button for opening sidebar
const sidebarButton = document.getElementsByClassName('header-hamburger')[0];
sidebarButton.addEventListener('click', () => {
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
});

// Clicking on map while sidebar is open will hide it
const mapElement = document.getElementsByClassName('map')[0];
mapElement.addEventListener('click', hideListView);

// Method for hiding sidebar if it is open
function hideListView () {
  const listView = document.getElementsByClassName('list-view')[0];
  const state = listView.classList.contains('show-list-view');
  if (state) {
    listView.classList.add('hide-list-view');
    listView.classList.remove('show-list-view');
  }
}
