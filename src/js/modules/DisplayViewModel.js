// ViewModel class utilized in Knockout.js initialization and data management
import GoogleMapView from './GoogleMapView';

class DisplayViewModel {
  constructor (currentModel) {
    /* Instance Variables */
    const self = this;
    self.mapReady = window.ko.observable(false);
    self.query = window.ko.observable('');

    // Determine if to include local language heading in title TODO
    if (currentModel.area.locallang) {
      self.mainTitle = `${currentModel.area.locallang} - ${currentModel.area.city} `;
      self.mainTitle += `${currentModel.area.type} Map Guide`;
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
      // Check if current search result has more than 1 item
      if (self.markersObservable().length > 1) {
        const currentMarkerIndex = self.markersObservable.indexOf(GoogleMapView.mainInfoWindow.marker);
        // Get index of target list-view entry the markers observable array
        let neighborMarkerIndex = (currentMarkerIndex + direction) % self.markersObservable().length;
        // Check if need to loop back to beginning of list
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
      if (searchInput !== '') {
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

  // Alphabetically sort display of locations by title
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
    const listView = document.getElementsByClassName('list-sidebar')[0];
    const state = listView.classList.contains('list-sidebar--show');
    // Hides sidebar if open and vice versa
    if (state) {
      listView.classList.add('list-sidebar--hide');
      listView.classList.remove('list-sidebar--show');
    } else {
      listView.classList.remove('list-sidebar--hide');
      listView.classList.add('list-sidebar--show');
    }
  }
}

export default DisplayViewModel;
