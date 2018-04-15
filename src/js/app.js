import DisplayViewModel from './modules/DisplayViewModel';
import GoogleMapView from './modules/GoogleMapView';

// TODO may implement import data from server or search result in the future
// Import model currently from local model.json file
import currentModel from '../model/model.json';

// Initialization

// Yelp service access token & cors server to use
GoogleMapView.YELP_API_KEY = `n9BZFWy_zC3jyQyNV9u0Tdc6IhfkwyV8b4JBg2NYD9AaQuHaUx6II9\
ukiEQp2Z03m7Cmycz29Lu2n4Gc5LPu1wDjVVCGyignkEoZn167yyq07sbPEN7gF5GzE20YWnYx`;
GoogleMapView.corsServer = 'https://museum-guide-server.herokuapp.com/';

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
