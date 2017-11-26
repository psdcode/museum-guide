// Main google map variable
let museumMap;
let mainInfoWindow;
let mapBounds;
// Array of map markers holding default locations
const markers = [];

class MapViewModel {
  constructor () {
    const self = this;
    this.mapReady = ko.observable('false');
    this.query = ko.observable('');

    // Observable Markers Array that will determine display of list and markers
    this.markersObservable = ko.observableArray([]);
    this.createMarkersObservable = ko.computed(function () {
      if (self.mapReady()) {
        self.markersObservable(markers);
        self.sort(self.markersObservable);
        return true;
      }
    }, self);

    this.selectMarker = function (clickedMarkerTitle) {
      for (const marker of self.markersObservable()) {
        if (marker.title === clickedMarkerTitle.title) {
          self.popInfoWindow(marker);
          self.toggleBounceMarker(marker);
          return;
        }
      }
    };

    this.filterMarkerList = function (searchInput) {
      // Search query is a non-empty string
      if (searchInput) {
        // Empty the observable list
        self.markersObservable([]);
        for (const marker of markers) {
          // Remove each marker
          if (marker.title.toUpperCase().indexOf(searchInput.toUpperCase()) >= 0) {
            self.markersObservable.push(marker);
            // Check if marker not already displayed to prevent blinking due to setting map again
            if (!marker.getMap()) marker.setMap(museumMap);
          } else {
            marker.setMap(null);
          }
        }
        self.sort(self.markersObservable);

      // Search query is empty string ''
      } else {
        // Display all markers on map
        for (const marker of markers) {
          marker.setMap(museumMap);
        }
        // Display all list items
        self.markersObservable(markers);
        self.sort(self.markersObservable);

        // TODO: check after responsive
        //museumMap.fitBounds(mapBounds);
      }
    };

    // Observable Subscriptions
    this.query.subscribe(self.filterMarkerList);
  }

  // ViewModel Methods
  sort (observableArray) {
    observableArray.sort((first, second) => {
      return first.title === second.title ? 0 : (first.title > second.title ? 1 : -1);
    });
  }

  toggleBounceMarker (marker) {
    if (marker.getAnimation()) {
      // If click again during animation marker will stop
      marker.setAnimation(null);
    } else {
      markers.forEach(otherMarker => otherMarker.setAnimation(null));
      // Set temporary bounce on selected marker
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 1500);
    }
  }

  popInfoWindow (marker) {
    if (mainInfoWindow.marker !== marker) {
      mainInfoWindow.marker = marker;

      // TODO: after build responsive decide if center on marker
      museumMap.panTo(marker.position);
      museumMap.panBy(0, -250);

      let markerContent = `<div class="title"><strong>${marker.title}</strong></div>`;

      // Spinner HTML below taken from http://tobiasahlin.com/spinkit/
      markerContent += '<div class="sk-circle">';
      for (let circleNum = 1; circleNum <= 12; circleNum++) {
        markerContent += `<div class="sk-circle${circleNum} sk-child"></div>`;
      }
      markerContent += '</div>';
      // END spinner HTML injection code

      // Place title & spinner into InfoWindow & open it
      mainInfoWindow.setContent(markerContent);
      mainInfoWindow.open(museumMap, marker);

      // Begin fetching data from Yelp
      getYelp(marker).then((yelpInfo) => {
        // Check if result exists (is not undefined)
        if (yelpInfo) {
          markerContent = `<div class="title"><strong>${marker.title}</strong></div>`;
          markerContent += `<img class="yelp-img" src=${yelpInfo.image_url} alt=${marker.title}>`;
          markerContent += `<div class="yelp-container">${getRatingImg(yelpInfo.rating)}`;
          markerContent += `<a target="_blank" href="${yelpInfo.url}"><img class="yelp-logo" \
  src="img/yelp_trademark_rgb_outline.png" srcset="img/yelp_trademark_rgb_outline_2x.png 2x" alt="Yelp Logo"></a>`;
          markerContent += `<a class="yelp-reviews" href="${yelpInfo.url}" target="_blank">Based on <strong>\
  ${yelpInfo.review_count}</strong> review${yelpInfo.review_count > 1 ? 's' : ''}</a>`;
          markerContent += `<p><address>${getYelpAddressHtml(yelpInfo.location.display_address)}</address></p>`;
          markerContent += `<p class="yelp-info">Currently <strong>${yelpInfo.is_closed ? 'CLOSED' : 'OPEN'}</strong><br>`;
          markerContent += `Phone: ${yelpInfo.display_phone}</p></div>`;
          mainInfoWindow.setContent(markerContent);
        } else {
        // Result is undefined, search term not in Yelp db
          markerContent = `<div class="title"><strong>${marker.title}</strong></div>`;
          markerContent += `<p>This museum's information is not found in Yelp.com's business directory. Try a different location.</p>`;
          mainInfoWindow.setContent(markerContent);
        }
      })
      .catch((err) => {
        console.log('Error during Yelp information formatting: ', err);
      });
    }

    // Helper method for formatting Yelp address html string
    function getYelpAddressHtml (yelpAddress) {
      // Remove 'Japan' from address since it's redundant in the context of a map of Tokyo
      if (yelpAddress[yelpAddress.length - 1] === 'Japan') yelpAddress = yelpAddress.slice(0, yelpAddress.length - 1);
      return yelpAddress.join('<br>');
    }

    // Helper method for selection and formatting of correct Yelp star rating img
    function getRatingImg (rating) {
      const ratingWhole = Math.floor(rating);
      const ratingHalf = (rating - ratingWhole === 0.5 ? '_half' : '');
      return `<img class="yelp-rating" src="img/yelp_stars_reg/regular_${ratingWhole}${ratingHalf}.png"\
srcset="img/yelp_stars_reg/regular_${ratingWhole}${ratingHalf}@2x.png 2x">`;
    }

    // Helper method for formatting search string from title
    function getSearchString (museumTitle) {
      return museumTitle.replace(/\s+/g, '+');
    }

    // Helper method for fetching Yelp info
    function getYelp (museumMarker) {
      // Since client-side requests to Yelp V3 API are not possible due to lack
      // of support for CORS and JSONP, 'cors-anywhere' app hack is employed as a proxy
      return fetch(`https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/\
businesses/search?term=${getSearchString(museumMarker.title)}&latitude=\
${museumMarker.position.lat()}&longitude=${museumMarker.position.lng()}`,
        {
          method: 'GET',
          headers: {
            'authorization': `Bearer n9BZFWy_zC3jyQyNV9u0Tdc6IhfkwyV8b4JBg2NYD9AaQuHaUx6II\
9ukiEQp2Z03m7Cmycz29Lu2n4Gc5LPu1wDjVVCGyignkEoZn167yyq07sbPEN7gF5GzE20YWnYx`
          }
        })
        .then((response) => response.json())
        .then((responseJSON) => {
          if (responseJSON.businesses) {
            console.log(responseJSON.businesses[0]);
            return responseJSON.businesses[0];
          }
        }).catch((err) => console.log('Error1: ' + err));
    }
  }

  resetMap () {
    museumMap.fitBounds(mapBounds);
    museumMap.panBy(0, -100);
    mainInfoWindow.marker = null;
    mainInfoWindow.close();
  }
}

// KOjs ViewModel initialization
const currentViewModel = new MapViewModel();
ko.applyBindings(currentViewModel);

// Map initalization function called by maps script
function initMap () {
  // Create new map centering on Tokyo, Japan
  museumMap = new google.maps.Map(document.querySelector('#map'), {
    // center: {
    //   lat: 35.6732619,
    //   lng: 139.5703029
    // },
    zoom: 11
  });
  mapBounds = new google.maps.LatLngBounds();
  mainInfoWindow = new google.maps.InfoWindow({
    maxWidth: 250
  });
  mainInfoWindow.addListener('closeclick', function () {
    mainInfoWindow.marker = null;
  });

  // Icon image:
  // Maps Icons Collection https://mapicons.mapsmarker.com
  // CC BY SA 3.0
  const museumIconImage = 'img/temple-2.png';

  for (const museum of museums) {
    const newMarker = new google.maps.Marker({
      position: museum.location,
      title: museum.title,
      animation: google.maps.Animation.DROP,
      icon: museumIconImage,
      map: museumMap
    });
    newMarker.addListener('click', function () {
      currentViewModel.popInfoWindow(this);
      currentViewModel.toggleBounceMarker(this);
    });
    markers.push(newMarker);
    mapBounds.extend(newMarker.position);
  }

  // Adjust map bounds to fit all markers
  museumMap.fitBounds(mapBounds);
  museumMap.panBy(0, -100);
  // Notify MapViewModel that google map initialization is complete
  currentViewModel.mapReady(true);
}

// function popInfoWindow (marker) {
//   if (mainInfoWindow.marker !== marker) {
//     mainInfoWindow.marker = marker;
//     mainInfoWindow.setContent(`<div>${marker.title}</div>`);
//     mainInfoWindow.open(museumMap, marker);
//     mainInfoWindow.addListener('closeclick', function () {
//       mainInfoWindow.setMarker = null;
//     });
//   }
// }

// function toggleBounceMarker (marker) {
//   if (marker.getAnimation()) {
//     marker.setAnimation(null);
//   } else {
//     markers.forEach(otherMarker => otherMarker.setAnimation(null));
//     marker.setAnimation(google.maps.Animation.BOUNCE);
//     setTimeout(() => marker.setAnimation(null), 1500);
//   }
// }

// function findMarkerForBounce (viewModel, clickedMarkerTitle) {
//   for (const marker of viewModel.markersObservable()) {
//     if (marker.title === clickedMarkerTitle.title) {
//       popInfoWindow(marker, mainInfoWindow);
//       toggleBounceMarker(marker);
//       return;
//     }
//   }
// }

const museums = [{
  title: 'Tokyo Metropolitan Art Museum',
  location: {
    lat: 35.717181,
    lng: 139.772818
  },
  place_id: 'ChIJb_o7HiiMGGARUKu8uO7fGIQ'
}, {
  title: 'Tokyo Waterworks Historical Museum',
  location: {
    lat: 35.7033346,
    lng: 139.7604967
  },
  place_id: 'ChIJrVm8DD2MGGARX70ZvbreBlQ'
}, {
  title: 'Mitsubishi Ichigokan Museum',
  location: {
    lat: 35.67833169999999,
    lng: 139.7632194
  },
  place_id: 'ChIJuyY-ZfqLGGAREYR9A10IXPQ'
}, {
  title: 'Tokyo Toy Museum',
  location: {
    lat: 35.68973,
    lng: 139.718039
  },
  place_id: 'ChIJHeBCIOyMGGAR7BktETlUP_w'
}, {
  title: 'Tokyo National Museum',
  location: {
    lat: 35.7187026,
    lng: 139.7763106
  },
  place_id: 'ChIJycHKF4OOGGARZlm_joH52qI'
}, {
  title: 'Advertising Museum Tokyo',
  location: {
    lat: 35.6649201,
    lng: 139.7625548
  },
  place_id: 'ChIJ2VtGysKLGGAR2oS8_Y_o-pk'
}, {
  title: 'National Museum of Western Art',
  location: {
    lat: 35.71538690000001,
    lng: 139.7758138
  },
  place_id: 'ChIJf8xB-pyOGGARizzhlNTcI7s'
}, {
  title: 'Samurai Museum',
  location: {
    lat: 35.6954844,
    lng: 139.7035426
  },
  place_id: 'ChIJ__-PU9iMGGAR6KHVhaRiqH8'
}, {
  title: 'National Museum of Nature and Science',
  location: {
    lat: 35.716357,
    lng: 139.7763826
  },
  place_id: 'ChIJ8Vuh65yOGGARyj4L5IBFiIk'
}, {
  title: 'National Museum of Modern Art',
  location: {
    lat: 35.6905432,
    lng: 139.7546932
  },
  place_id: 'ChIJL0kSfg2MGGARKv5KX53ZZ2Y'
}, {
  // TODO test entry
  title: 'jfksldjf sdlkfjsldkjf',
  location: {
    lat: 40.761484,
    lng: -73.977664
  },
  place_id: 'ChIJL0kSfg2MGGARKv5KX53ZZ2Y'
}];
