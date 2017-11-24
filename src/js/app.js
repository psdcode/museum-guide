// Main google map variable
let museumMap;
let mainInfoWindow;

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
      }
    };

    // Observable Subscriptions
    this.query.subscribe(self.filterMarkerList);
  }

  sort (observableArray) {
    observableArray.sort((first, second) => {
      return first.title === second.title ? 0 : (first.title > second.title ? 1 : -1);
    });
  }

  toggleBounceMarker (marker) {
    if (marker.getAnimation()) {
      marker.setAnimation(null);
    } else {
      markers.forEach(otherMarker => otherMarker.setAnimation(null));
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 1500);
    }
  }

  popInfoWindow (marker) {
    if (mainInfoWindow.marker !== marker) {
      mainInfoWindow.marker = marker;
      mainInfoWindow.setContent(`<div>${marker.title}</div>`);
      mainInfoWindow.open(museumMap, marker);
      mainInfoWindow.addListener('closeclick', function () {
        mainInfoWindow.setMarker = null;
      });
    }
  }
}

// KOjs ViewModel initialization
const currentViewModel = new MapViewModel();
ko.applyBindings(currentViewModel);

// Map initalization function called by maps script
function initMap () {
  // Create new map centering on Tokyo, Japan
  museumMap = new google.maps.Map(document.querySelector('#map'), {
    center: {
      lat: 35.6732619,
      lng: 139.5703029
    },
    zoom: 11
  });

  const mapBounds = new google.maps.LatLngBounds();
  const museumIconImage = 'img/museum_24_2x.png';

  mainInfoWindow = new google.maps.InfoWindow();

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
}];
