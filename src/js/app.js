import DisplayViewModel from './modules/DisplayViewModel';
import GoogleMapView from './modules/GoogleMapView';

// TODO may implement import data from server or search result in the future
// Import model currently from local model.json file
import currentModel from '../model/model.json';

// Initialization

// Cors server to use for Yelp API 3.0 Fusion calls
// No '/' at the end of server address
GoogleMapView.corsServer = 'https://museum-guide-server.herokuapp.com';

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

// GruntReplacePosition
