class DisplayViewModel {
  constructor () {
    const self = this;
    self.mapReady = ko.observable(false);
    self.query = ko.observable('');
    self.mainTitle = `${currentModel.area.localname} - ${currentModel.area.city} ${currentModel.area.type} Map Guide`;
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

    self.clickLocationList = function (clickedMarker) {
      GoogleMapView.popInfoWindow(clickedMarker);
      GoogleMapView.toggleBounceMarker(clickedMarker);
    };

    self.filterMarkerList = function (searchInput) {
      // Search query is a non-empty string
      if (searchInput) {
        // Empty the observable list
        self.markersObservable([]);
        for (const marker of GoogleMapView.markers) {
          const markerTitle = marker.title.toUpperCase();
          if (markerTitle.indexOf(searchInput.toUpperCase()) >= 0) {
            // Readd markers to observable array only if title match search query
            self.markersObservable.push(marker);
            // Check if marker not already displayed to prevent blinking due to setting map again
            if (!marker.getMap()) GoogleMapView.setMarkerMap(marker, map);
          } else {
            // Marker title did not match search query, remove it from map
            GoogleMapView.setMarkerMap(marker, null);
          }
        }
        // Sort remaining markers after query
        self.sort(self.markersObservable);

      // Search query is empty string ''
      } else {
        // Display all markers on map
        for (const marker of GoogleMapView.markers) {
          if (!marker.getMap()) GoogleMapView.setMarkerMap(marker, map);
        }
        // Display all list items
        self.markersObservable(GoogleMapView.markers);
        self.sort(self.markersObservable);
      }
    };

    // Observable Subscriptions
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

// Class handling google map display
class GoogleMapView {
  // maps.googleapis.com script initial loading error callback
  static errorLoadMap () {
    alert('Unable to load Google Map at this time. Check your connection or try again later');
  }

  // googleapis.com initalization success callback
  static initMap () {
    // Create new map
    map = new google.maps.Map(document.getElementById('map'), {
      // Center on city
      center: {
        lat: currentModel.area.position.lat,
        lng: currentModel.area.position.lng
      },
      zoom: 12
    });

    // Markers and bounds setup
    GoogleMapView.markers = [];
    GoogleMapView.mapBounds = new google.maps.LatLngBounds();

    // InfoWindow configuration
    GoogleMapView.mainInfoWindow = new google.maps.InfoWindow({
      maxWidth: 250
    });
    GoogleMapView.mainInfoWindow.addListener('closeclick', function () {
      GoogleMapView.mainInfoWindow.marker = null;
    });

    // Declare listener callback outside of loop to avoid jshint warning
    const listenerPopInfo = function () {
      GoogleMapView.popInfoWindow(this);
      GoogleMapView.toggleBounceMarker(this);
    };
    // Create array of Markers from provided location info
    for (const location of currentModel.locations) {
      const newMarker = new google.maps.Marker({
        position: location.position,
        title: location.title,
        animation: google.maps.Animation.DROP,
        icon: 'data/' + location.icon,
        map
      });
      newMarker.addListener('click', listenerPopInfo);
      GoogleMapView.markers.push(newMarker);
      GoogleMapView.mapBounds.extend(newMarker.position);
    }

    // Adjust map bounds to fit all markers
    map.fitBounds(GoogleMapView.mapBounds, -50); // TODO
    map.panBy(0, -100); // TODO

    // Notify current instance of DisplayViewModel that google map initialization is complete
    DisplayViewModel.instance.mapReady(true);
  }

  static popInfoWindow (marker) {
    // First check if InfoWindow not already onen on clicked marker
    if (GoogleMapView.mainInfoWindow.marker !== marker) {
      GoogleMapView.mainInfoWindow.marker = marker;

      // Center on marker & move up map to allow for info window display
      map.panTo(marker.position);
      map.panBy(0, -270);

      // Begin construction of InfoWindow content
      let markerContent = `<div class="title"><strong>${marker.title}</strong></div>`;

      // Spinner HTML below taken from http://tobiasahlin.com/spinkit/
      markerContent += '<div class="sk-circle">';
      for (let circleNum = 1; circleNum <= 12; circleNum++) {
        markerContent += `<div class="sk-circle${circleNum} sk-child"></div>`;
      }
      markerContent += '</div>';
      // END spinner HTML injection code

      // Place title & spinner into InfoWindow & open it
      GoogleMapView.mainInfoWindow.setContent(markerContent);
      GoogleMapView.mainInfoWindow.open(map, marker);

      // Begin fetching data from Yelp
      getYelp(marker).then(yelpInfo => {
        // Only enter here if no connection issues
        if (yelpInfo) {
          // Yelp result exists. Remove spinner by reassigning markerContent
          markerContent = `<div class="title"><strong>${marker.title}</strong></div>`;
          markerContent += `<img class="yelp-img" src=${yelpInfo.image_url} alt=${marker.title}>`;
          markerContent += `<div class="yelp-container">${getRatingImg(yelpInfo.rating)}`;
          markerContent += `<a target="_blank" href="${yelpInfo.url}"><img class="yelp-logo" \
src="img/yelp_trademark_rgb_outline.png" srcset="img/yelp_trademark_rgb_outline_2x.png 2x" \
alt="Yelp Logo"></a>`;
          markerContent += `<a class="yelp-reviews" href="${yelpInfo.url}" target="_blank">Based \
on <strong>${yelpInfo.review_count}</strong> review${yelpInfo.review_count > 1 ? 's' : ''}</a>`;
          markerContent += `<p><address>${getYelpAddressHtml(yelpInfo.location.display_address)}\
</address></p>`;
          markerContent += `<p class="yelp-info">Currently \
<strong>${yelpInfo.is_closed ? 'CLOSED' : 'OPEN'}</strong><br>`;
          markerContent += `Phone: ${yelpInfo.display_phone}</p></div>`;
          GoogleMapView.mainInfoWindow.setContent(markerContent);
        } else {
        // Result undefined, search term not in Yelp database
          markerContent = `<div class="title"><strong>${marker.title}</strong></div>`;
          markerContent += `<p>This location's information is not found in Yelp's business \
directory. Try a different location.</p>`;
          GoogleMapView.mainInfoWindow.setContent(markerContent);
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

  static resetMap () {
    map.fitBounds(GoogleMapView.mapBounds);
    map.panBy(0, -100);
    GoogleMapView.mainInfoWindow.marker = null;
    GoogleMapView.mainInfoWindow.close();
  }

  static setMarkerMap (marker, map) {
    marker.setMap(map);
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

// Main global google map variables accessed by DisplayViewModel
let map;

// import model declared in model.js
// TODO may implement import data from server in future
const currentModel = Object.assign({}, modelToImport);

// Array of map markers holding default locations
const markers = [];

// Yelp service access token
GoogleMapView.YELP_TOKEN = `n9BZFWy_zC3jyQyNV9u0Tdc6IhfkwyV8b4JBg2NYD9AaQuHaUx6II9\
ukiEQp2Z03m7Cmycz29Lu2n4Gc5LPu1wDjVVCGyignkEoZn167yyq07sbPEN7gF5GzE20YWnYx`;

// KOjs DisplayViewModel initialization
DisplayViewModel.instance = new DisplayViewModel();
ko.applyBindings(DisplayViewModel.instance);
