// ViewModel class utilized in Knockout.js initialization and data management
import GoogleMapView from './GoogleMapView';
import modal from './Modal';

class DisplayViewModel {
  constructor (currentModel) {
    const self = this;

    // Google Map load state
    self.markersReady = window.ko.observable('');
    // Filter query string
    self.query = window.ko.observable('');
    self.mapLoadFail = window.ko.observable(false);

    // Form selection values
    self.selectedCityValue = window.ko.observable();
    self.selectedSearchValue = window.ko.observable('curated');

    // Display variables
    self.computedCityString = window.ko.observable();
    self.displayedCityString = window.ko.observable();

    // Array of city info for modal form__select element
    self.cities = currentModel.cities.map((cityObj) => ({
      cityString: `${cityObj.cityName} - ${cityObj.localLang}`,
      cityValue: cityObj.cityName
    }));

    // Object holding all city information, computed based on modal form selection
    self.selectedCityObj = window.ko.computed(function () {
      // Find corresponding city object to selected city value from modal dropdown
      const cityObj = currentModel.cities.find((cityLook) => (cityLook.cityName === self.selectedCityValue()));
      // Set selected to be displayed after form submission
      if (cityObj) {
        // Determine if to include local language heading in title
        if (cityObj.localLang) {
          self.computedCityString(`${cityObj.cityName} - ${cityObj.localLang}`);
        } else {
          self.computedCityString(cityObj.cityName);
        }
      }
      return cityObj;
    });

    // Observable Markers Array that will determine display of list of locations and map markers
    self.markersObservable = window.ko.observableArray([]);
    // Current marker
    self.selectedMarker = window.ko.observable(undefined);

    // Computed observable loads markers once map initialization complete
    self.createMarkersObservable = window.ko.computed(function () {
      if (self.markersReady()) {
        console.log('Load New MarkersObservable'); // TODO
        self.markersObservable(GoogleMapView.markers);
        self.sort(self.markersObservable);
        return true;
      }
    }, self);

    // Observable subscription for instant filtering of query results
    self.query.subscribe(self.filterMarkerList.bind(self));
  }

  // Method to open InfoWindow using prev/next buttons
  clickArrow (direction) {
    // direction: -1 for entry above, 1 for entry below in list
    // Check if current search result has more than 1 item
    if (this.markersObservable().length > 1) {
      const currentMarkerIndex = this.markersObservable.indexOf(GoogleMapView.mainInfoWindow.marker);
      // Get index of target list-view entry in the markers observable array
      let neighborMarkerIndex = (currentMarkerIndex + direction) % this.markersObservable().length;
      // Check if need to loop back to beginning of list
      if (neighborMarkerIndex === -1) {
        neighborMarkerIndex = this.markersObservable().length - 1;
      }
      const neighborMarker = this.markersObservable()[neighborMarkerIndex];
      GoogleMapView.popInfoWindow(neighborMarker);
    }
  }

  // When click a location in sidebar
  clickLocationList (clickedListItemMarker) {
    // Hide sidebar if open to display InfoWindow
    if (window.matchMedia('(max-width: 767px)').matches) {
      DisplayViewModel.instance.toggleSidebar();
    }
    GoogleMapView.popInfoWindow(clickedListItemMarker);
  }

  // Called by 'Change City' btn
  changeCity () {
    modal.openModal();
  }

  // Navigate to next available marker InfoWindow in list
  clickNextArrow () {
    this.clickArrow(1);
  }

  // Navigate to previous available marker InfoWindow in list
  clickPrevArrow () {
    this.clickArrow(-1);
  }

  // Called by X close modal button
  closeModal () {
    modal.closeModal(modal);
  }

  // Filter obsrvable location list and markers based on query
  filterMarkerList (searchInput) {
    // Search query is a non-empty string
    if (searchInput !== '') {
      // Empty the observable list
      this.markersObservable([]);
      GoogleMapView.markers.forEach(function (checkMarker) {
        // Re-add marker to observable array only if marker title match search query
        const markerTitle = checkMarker.title.toUpperCase();
        if (markerTitle.indexOf(searchInput.toUpperCase()) >= 0) {
          // Positive match between query and marker title
          this.markersObservable.push(checkMarker);
          // Check if marker not already displayed to prevent blinking due to setting map again
          if (!checkMarker.getMap()) {
            GoogleMapView.setMarkerMap(checkMarker, true);
          }
          GoogleMapView.queryBoundsExtend(checkMarker.position);
        // Marker title did not match search query, remove it from map
        } else {
          GoogleMapView.setMarkerMap(checkMarker, false);
        }
      }, this);

      const markersLength = this.markersObservable().length;
      // Open info window if 1 marker matches search
      if (markersLength === 1) {
        if (!GoogleMapView.mainInfoWindow.marker) {
          GoogleMapView.popInfoWindow(this.markersObservable()[0]);
        }
        // Will set queryBounds to undefined, no bounds fit
        GoogleMapView.queryBoundsFit(false);

      // Else sort remaining markers after query and apply new bounds
      // only if more than 1 marker matches search
      } else if (markersLength > 1) {
        // Close InfoWindow if open on a marker
        GoogleMapView.closeInfoWindow();
        this.sort(this.markersObservable);
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
      this.markersObservable(GoogleMapView.markers);
      this.sort(this.markersObservable);
      this.resetMap();
    }
  }

  getVisibleMarkers () {
    return this.markersObservable();
  }

  // Method bound to each list element determines if selection class applied
  listElementInfoWindowOpen (listMarker) {
    if (this.selectedMarker() === listMarker) {
      return true;
    }
    return false;
  }

  loadData () {
    // Form radio 'Curated' option
    if (this.selectedSearchValue() === 'curated') {
      GoogleMapView.loadCuratedMarkers(this.selectedCityObj());
      modal.closeModal(modal);
      this.displayedCityString(this.computedCityString());
    // Form radio option 'Live Search'
    } else if (this.selectedSearchValue() === 'liveSearch') {
      // Temporary setTimeout until search function is properly working TODO
      setTimeout(function () {
        GoogleMapView.loadCuratedMarkers(this.selectedCityObj());
        modal.closeModal(modal);
        this.displayedCityString(this.computedCityString());
      }.bind(this), 1500);
    }
  }

  notifyMapLoadFail (failState) {
    this.mapLoadFail(failState);
  }

  // Allows GoogleMapView class to inform DisplayViewModel of openInfoWindow on
  // marker
  setSelectedMarker (marker) {
    this.selectedMarker(marker);
  }

  // Alphabetically sort display of locations by title
  sort (observableArray) {
    observableArray.sort((first, second) => {
      return first.title === second.title ? 0 : (first.title > second.title ? 1 : -1);
    });
  }

  // Called by 'Reset Map' btn
  resetMap () {
    this.query('');
    GoogleMapView.resetMap();
  }

  submitModal () {
    modal.openFormLoadScreen();
    this.loadData();
  }

  // Shows/hides modal with hamburger <hiddenon>
  toggleSidebar () {
    const sidebars = document.getElementsByClassName('sidebar');
    const hamburgerBars = document.getElementsByClassName('hamburger__bar');
    const state = sidebars[0].classList.contains('sidebar--show');
    // Hides sidebar if open and vice versa
    if (state) {
      for (const sidebar of sidebars) {
        sidebar.classList.add('sidebar--hide');
        sidebar.classList.remove('sidebar--show');
      }
      // Inactivate hamburger bars color
      for (const hamburgerBar of hamburgerBars) {
        hamburgerBar.classList.remove('hamburger__bar--active');
      }
    } else {
      for (const sidebar of sidebars) {
        sidebar.classList.remove('sidebar--hide');
        sidebar.classList.add('sidebar--show');
      }
      // Activate hamburger bars color
      for (const hamburgerBar of hamburgerBars) {
        hamburgerBar.classList.add('hamburger__bar--active');
      }
    }
  }
}

export default DisplayViewModel;
