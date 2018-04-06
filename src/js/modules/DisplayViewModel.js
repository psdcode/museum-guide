// ViewModel class utilized in Knockout.js initialization and data management
import GoogleMapView from './GoogleMapView';
import modal from './Modal';

class DisplayViewModel {
  constructor (currentModel) {
    const self = this;

    // Google Map load fail state indicator
    self.mapLoadFail = window.ko.observable(false);

    // Map markers values, global deferred but here always notify to force markers reset on new markers load
    self.markersReady = window.ko.observable('').extend({ notify: 'always' });
    // Observable Markers Array that will determine display of list of locations and map markers
    self.markersObservable = window.ko.observableArray([]);
    // Current marker
    self.selectedMarker = window.ko.observable(undefined);
    // Computed observable loads markers once map & markers initialization by GoogleMapView is complete
    self.createMarkersObservable = window.ko.computed(function () {
      if (self.markersReady()) {
        self.markersObservable(GoogleMapView.markers);
        self.markersSort(self.markersObservable);
        return true;
      }
    }, self);

    // Filter/Search query properties
    self.query = window.ko.observable('');
    // Compare query with queryOld to ignore addition of trailing spaces
    self.queryOld = window.ko.observable('');
    self.queryPlaceholder = window.ko.observable('');
    // Observable subscription for instant filtering of query results
    self.query.subscribe(self.queryProcessInput, self);
    // Input Debounce delay setup for live search Input
    self.queryLiveSearch = window.ko.observable(self.query());
    // Launch live search after debounce of 600ms of input query
    self.queryLiveSearchDelayed = window.ko.pureComputed(self.queryLiveSearch)
      .extend({
        rateLimit: {
          method: 'notifyWhenChangesStop',
          timeout: 750
        }
      });
    // Observable subscription for live search of query input
    self.queryLiveSearchDelayed.subscribe(self.searchPlaces, self);
    // Control display of search spinner
    self.queryLiveSearchLoading = window.ko.observable(false);
    // Abnormal search result message
    self.queryLiveSearchResultText = window.ko.observable('');

    // Current city display values
    self.computedCityString = window.ko.observable();
    self.displayedCityString = window.ko.observable();

    // Form values
    self.form = {};
    // Default form settings
    self.form.selectedCityValue = window.ko.observable('Tokyo');
    self.form.selectedListMode = window.ko.observable('curated');
    // Array of city info for modal form select element
    self.form.optionsCities = currentModel.cities.map((cityObj) => ({
      cityString: `${cityObj.cityName}${cityObj.localLang ? ' - ' + cityObj.localLang : ''}`,
      cityValue: cityObj.cityName
    }));
    // Object holding all city information, recomputed based on modal form city selection
    self.form.selectedCityObj = window.ko.computed(function () {
      // Find corresponding city object to selected city value from modal dropdown
      const cityObj = currentModel.cities.find((cityLookup) =>
        (cityLookup.cityName.toLowerCase() === self.form.selectedCityValue().toLowerCase()));
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
    // Determine if curated locations available for city.
    // If not, disable curated radio button and select liveSearch
    self.form.curatedDisabled = window.ko.computed(function () {
      if (self.form.selectedCityObj().locations.length === 0) {
        self.form.selectedListMode('liveSearch');
        return true;
      } else {
        self.form.selectedListMode('curated');
        return false;
      }
    });
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

  // Clear sidebar list
  clearMarkersObservable () {
    this.markersObservable([]);
  }

  // Filter obsrvable location list and markers based on query
  filterMarkerList (filterInput) {
    // Search query is a non-empty string
    if (filterInput !== '') {
      // First empty the observable list
      this.markersObservable([]);
      GoogleMapView.markers.forEach(function (checkMarker) {
        // Re-add marker to observable array only if marker title match search query
        const markerTitle = checkMarker.title.toUpperCase();
        if (markerTitle.indexOf(filterInput.toUpperCase()) >= 0) {
          // Positive match between query and marker title
          this.markersObservable.push(checkMarker);
          // Check if marker not already displayed to prevent blinking due to setting map again
          if (!checkMarker.getMap()) {
            GoogleMapView.setMarkerOnMap(checkMarker, true);
          }
          GoogleMapView.queryBoundsExtend(checkMarker.position);
        // Marker title did not match search query, remove it from map
        } else {
          GoogleMapView.setMarkerOnMap(checkMarker, false);
        }
      }, this);

      const markersLength = this.markersObservable().length;
      // Open info window automatically if only 1 marker matches search
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
        this.markersSort(this.markersObservable);
        // Fit query bounds
        GoogleMapView.queryBoundsFit(true);
      }

    // Search query is empty string ''
    } else {
      // Display all markers on map
      GoogleMapView.markers.forEach(function (checkMarker) {
        if (!checkMarker.getMap()) {
          GoogleMapView.setMarkerOnMap(checkMarker, true);
        }
      });
      // Display all list items
      this.markersObservable(GoogleMapView.markers);
      this.markersSort(this.markersObservable);
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

  loadFormData () {
    // Form radio 'Curated' mode selected
    if (this.form.selectedListMode() === 'curated') {
      this.queryPlaceholder('Filter...');
      // Calls resetMap automatically at the end of call below
      GoogleMapView.loadMode(this.form.selectedCityObj(), 'curated');

    // Form radio 'Live Search' mode selected
    } else if (this.form.selectedListMode() === 'liveSearch') {
      this.queryPlaceholder('Search...');
      // Calls resetMap automatically at the end of call below
      GoogleMapView.loadMode(this.form.selectedCityObj(), 'liveSearch');
    }

    // Changes to apply to either mode
    this.query('');
    this.queryLiveSearchResultText('');
    this.displayedCityString(this.computedCityString());
    // Close Modal
    modal.closeModal(modal);
  }

  notifyMapLoadFail (failState) {
    this.mapLoadFail(failState);
  }

  // Alphabetically sort display of locations by title
  markersSort (observableArray) {
    observableArray.sort((first, second) => {
      return first.title === second.title ? 0 : (first.title > second.title ? 1 : -1);
    });
  }

  queryProcessInput (queryInput) {
    queryInput = queryInput.trim();
    // Proceed with query processing only if a non-space character was added
    if (queryInput !== this.queryOld()) {
      this.queryOld(queryInput);
      if (this.form.selectedListMode() === 'curated') {
        this.filterMarkerList(queryInput);
      } else if (this.form.selectedListMode() === 'liveSearch') {
        // Subscription will launch searchPlaces search automatically
        this.queryLiveSearch(this.query());
      }
    }
  }

  // Called by 'Reset Map' btn
  resetMap () {
    this.query('');
    this.queryLiveSearchResultText('');
    this.queryLiveSearchLoading(false);
    GoogleMapView.resetMap();
  }

  searchPlaces (searchInput) {
    const self = this;

    // Initiate search if input longer than 2 non-space characters
    if (searchInput.length > 2) {
      // Turn on loading spinner
      self.queryLiveSearchLoading(true);
      const cityName = self.form.selectedCityObj().cityName;
      const position = self.form.selectedCityObj().position;
      GoogleMapView.livePlacesSearch(cityName, position, searchInput);
    }
  }

  searchPlacesCompleted (status) {
    // Turn off spinner
    this.queryLiveSearchLoading(false);
    // Display message only if no results or error
    if (status === 'success') {
      this.queryLiveSearchResultText('');
    } else if (status === 'noresults') {
      this.queryLiveSearchResultText('No Results');
    } else if (status === 'error') {
      this.queryLiveSearchResultText('Search Error');
    }
  }

  // Allows GoogleMapView class to inform DisplayViewModel of openInfoWindow on
  // marker
  setSelectedMarker (marker) {
    this.selectedMarker(marker);
  }

  // Submit modal form info
  submitModal () {
    modal.openFormLoadScreen();
    this.loadFormData();
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
