import DisplayViewModel from './modules/DisplayViewModel';
import GoogleMapView from './modules/GoogleMapView';
// Import model currently from local model.js file
// TODO may implement import data from server or search result in the future
// const currentModel = Object.assign({}, model);
import {model as currentModel} from '../model/model';

// Initialization

// Yelp service access token
GoogleMapView.YELP_TOKEN = `n9BZFWy_zC3jyQyNV9u0Tdc6IhfkwyV8b4JBg2NYD9AaQuHaUx6II9\
ukiEQp2Z03m7Cmycz29Lu2n4Gc5LPu1wDjVVCGyignkEoZn167yyq07sbPEN7gF5GzE20YWnYx`;

// Give GoogleMapView access to model
GoogleMapView.defaultPosition = currentModel.defaultArea.position;

// Knockout.js DisplayViewModel initialization with model
if (window.ko) {
  DisplayViewModel.instance = new DisplayViewModel(currentModel);
  window.ko.applyBindings(DisplayViewModel.instance);
}

// End
