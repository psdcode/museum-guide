class GoogleMapPlacesSearch {
  constructor (map, googleMapView) {
    this.placesService = new window.google.maps.places.PlacesService(map);
    this.googleMapView = googleMapView;
  }

  // Main method for initiating places search
  liveSearch (cityName, latLng, type, searchTerm) {
    const self = this;

    // Nearby search request object
    const nearbySearchRequest = {
      keyword: cityName,
      location: latLng,
      name: searchTerm,
      radius: 10000,
      type
    };

    // Nearby search request callback
    function nearbySearchCb (results, status) {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const nearbySearchPlaceIds = results.slice(0, 10).map((place) => (place.place_id));
        // Use obtained placeIDs to fetch detailed data for each place
        self.getDetailsFromPlaceIds(nearbySearchPlaceIds);
      } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
        // If over query limit, attempt another call in 200ms
        window.setTimeout(function () {
          self.placesService.nearbySearch(nearbySearchRequest, nearbySearchCb);
        }, 200);
      } else {
        // If connection or search error, abort and pass error message
        const error = new Error(status);
        self.googleMapView.loadPlacesSearchResults(error);
      }
    }

    // Initiate Search
    self.placesService.nearbySearch(nearbySearchRequest, nearbySearchCb);
  }

  // Perform getDetails call on each placeID provided
  getDetailsFromPlaceIds (placeIds) {
    const self = this;
    // Create array of promises for each placeID getDetails call
    const getDetailsPromises = placeIds.map(function (placeId) {
      return new Promise(function (resolve, reject) {
        self.getDetailsFromSinglePlaceId(placeId, resolve, reject);
      });
    });

    Promise.all(getDetailsPromises)
      .then(self.formatResults)
      // Upon resolution of promises pass search data back to GoogleMapView
      .then(self.googleMapView.loadPlacesSearchResults)
      // If error is caught, pass it also
      .catch(self.googleMapView.loadPlacesSearchResults);
  }

  getDetailsFromSinglePlaceId (placeId, passedResolve, passedReject) {
    const self = this;
    // Resolve promise on successful data retrieval
    self.placesService.getDetails({placeId}, function (results, status) {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        passedResolve(results);
      } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
        // If over query limit, attempt another call in 200ms
        window.setTimeout(function () {
          self.getDetailsFromSinglePlaceId(placeId, passedResolve, passedReject);
        }, 200);
      } else {
        // Any other status response will pass error back
        const error = new Error(status);
        passedReject(error);
      }
    });
  }

  // Transform data to a format GoogleMapview can use to load markers
  formatResults (unformattedPlaceResults) {
    const formattedPlaceResults = unformattedPlaceResults.map(function (place) {
      return {
        title: place.name,
        position: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        },
        type: 'general',
        place_id: place.place_id
      };
    });
    return formattedPlaceResults;
  }
}

export default GoogleMapPlacesSearch;
