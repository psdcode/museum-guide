# Tokyo Museum Map Guide

Final project for Udacity's Front-End Web Developer Nanodegree.

## General Overview

This single-page app is an interactive Google Maps based guide to select museums in Tokyo, Japan. Detailed information for each location is provided via Yelp's business directory.

## Viewing & Build Instructions

1. Download and unzip the repository.
2. Navigate to the 'dist' folder and open 'index.html' in a web browser.

Alternatively, you may build the production code yourself from source.

1. Download and unzip the repository.
2. Navigate to the downloaded directory and run 'npm install' from the command line.
3. Run 'grunt build' from the command line.
2. Navigate to the 'dist' folder and open 'index.html' in a web browser.

## Usage Tips

* Information about a specific museum from Yelp's business directory can be displayed by either clicking its corresponding marker on the map or name in the sidebar. To navigate in a new tab to the museum's Yelp page click the 'Yelp' logo or 'Based on ... reviews' text.
* On smaller screens the sidebar is hidden by default. It can be revealed by clicking the 'hamburger' menu button in the top right corner of the screen. Clicking again on the menu button or anywhere on the map will hide the sidebar.
* To search for a specific museum by name, enter a query into the text box in the top left corner of the screen to automatically filter the list of available museums. If only one museum matches the query, its information window will automatically open.
* Once a museum's information window is open, it is possible to navigate to neighbouring museums on the list by pressing the arrow buttons at the bottom of the information window.
* To reset the map to its initial view and display all available museums press the 'Reset Map' button next to the search box in the top left corner of the screen.

## Tools and Resources Used
* [Google Maps JavaScript API V3](https://developers.google.com/maps/)
* [Yelp Fusion API 3.0](https://www.yelp.com/developers/documentation/v3)
* [Knockout.js](http://knockoutjs.com/)
* [Google Fonts](https://fonts.google.com)
* [Normalize.css](https://necolas.github.io/normalize.css/)
* [Babel](https://babeljs.io/)
* [Rollup.js](https://rollupjs.org)
* [PostCSS](postcss.org)
* [Grunt Task Runner](https://gruntjs.com)
* For full list of all Grunt plugins used see package.json
* [CSS Spinner](http://tobiasahlin.com/spinkit/) by Tobias Ahlin
* [Maps Icons Collection](https://mapicons.mapsmarker.com) CC BY SA 3.0
* [Custom Google Map Style](https://snazzymaps.com/style/4105/brokka-map) by eshuz CC0 1.0

License: ISC 2017
