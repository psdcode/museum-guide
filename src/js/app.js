import DisplayViewModel from './modules/DisplayViewModel';
import GoogleMapView from './modules/GoogleMapView';

// Initialization

// Cors server to use for Yelp API 3.0 Fusion calls
// (No '/' at the end of server address)
GoogleMapView.corsServer = 'https://museum-guide-server.herokuapp.com';
// GoogleMapView.corsServer = 'http://localhost:8080';

// Retrieve data model from server and halt map initialization until complete
GoogleMapView.initialLoadPromise = new Promise(function (resolve, reject) {
  window.fetch(`${GoogleMapView.corsServer}/model`, {
    method: 'GET'
  })
    .then(response => response.json())
    .then(function (modelReceived) {
      const currentModel = modelReceived;

      // Tell GoogleMapView initial map load position
      GoogleMapView.defaultPosition = currentModel.defaultArea.position;
      GoogleMapView.defaultType = currentModel.defaultArea.type;

      // Knockout.js DisplayViewModel initialization with model
      if (window.ko) {
        // Defer Updates turns on asynchronous updating to avoid
        // redundant intermediate updates of observables.
        window.ko.options.deferUpdates = true;
        DisplayViewModel.instance = new DisplayViewModel(currentModel);
        window.ko.applyBindings(DisplayViewModel.instance);
      }
      // Allow map initialization
      resolve();
    })
    // Could not retrieve model, prevent map initialization
    .catch(function (err) {
      console.log('inside app.js catch');
      GoogleMapView.errorLoadMap();
      reject(err);
    });
});

// GruntReplacePosition
