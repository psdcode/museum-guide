'use strict'; // jshint ignore:line

import DisplayViewModel from './modules/DisplayViewModel';
import GoogleMapView from './modules/GoogleMapView';

// Import locally stored model
import currentModel from '../model/model.json';

// Initialization

// Cors server to use for Yelp API 3.0 Fusion calls
// (No '/' at the end of server address)
// GoogleMapView.corsServer = 'https://museum-guide-server.herokuapp.com';
GoogleMapView.corsServer = 'http://localhost:8080';

// Wakeup dedicated heroku cors server
window.fetch(`${GoogleMapView.corsServer}/wakeup`, {
  method: 'GET'
})
  // Catch fetch fail: could not retrieve model, prevent map initialization
  .catch(function (err) {
    return new Error(err.message);
  });

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
