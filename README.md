# Museum Map Guide: Japan

## General Overview

An interactive single-page [Knockout.JS](http://knockoutjs.com/) and [Google Maps](https://developers.google.com/maps/) based app guide to museums in major cities in Japan. Offers both a curated selection of ten museum locations for the three largest cities (Tokyo, Yokohama, Osaka), as well as a live search feature for all listed cities. Detailed information for each location is provided via Yelp's business directory.

This project is an expanded version of my [final project](https://github.com/psdcode/fend-neighborhood-map) for Udacity's Front-End Web Developer Nanodegree.

## Access

The map may be accessed at [docs.github.io](docs.github.io)

## Local Viewing & Build Instructions

1. Download and unzip the repository.
2. Navigate to the 'docs' folder and open 'index.html' in a web browser.

Alternatively, you may build the production code yourself from source.

1. Download and unzip the repository.
2. Navigate to the downloaded directory and run 'npm install' from the command line.
3. Run 'grunt prod' from the command line.
2. Navigate to the 'docs' folder and open 'index.html' in a web browser.

## Usage Tips

* Information about a specific museum from Yelp's business directory can be displayed by either clicking its corresponding marker on the map or listed name in the sidebar. To navigate in a new tab to the museum's Yelp page click the 'Yelp' logo or 'Based on ... reviews' text.
* On smaller screens the sidebar is hidden by default. It can be revealed by clicking the 'hamburger' menu button in the top right corner of the screen. Clicking again on the menu button or anywhere on the map will hide the sidebar.
* To filter a specific museum by name in curated mode, enter a query into the text box in the top left corner of the screen to automatically filter the list of available museums. To search for a specific museum in live search mode, enter a query into the same text box. If only one museum matches the query in either mode, its information window will automatically pop open.
* Once a museum's information window is open, it is possible to navigate to neighbouring museums on the list by pressing the arrow buttons at the bottom of the information window.
* To change city or change mode, click the 'Change City' button in the top left corner of the sidebar.
* To reset the map to its initial view and display all available museums in curated mode or remove all search results in live search mode, press the 'Reset Map' button in the top left corner of the sidebar.

## Tools and Resources Used

* [Knockout.js](http://knockoutjs.com/)
* [Google Maps JavaScript API V3](https://developers.google.com/maps/)
* [Yelp Fusion API 3.0](https://www.yelp.com/developers/documentation/v3)
* [Google Fonts](https://fonts.google.com)
* [Grunt Task Runner](https://gruntjs.com)
* [Rollup.js](https://rollupjs.org)
* [Babel](https://babeljs.io/)
* [Normalize.css](https://necolas.github.io/normalize.css/)
* [PostCSS](postcss.org)
* [CSS Spinner](http://tobiasahlin.com/spinkit/) by Tobias Ahlin
* [Maps Icons Collection](https://mapicons.mapsmarker.com) CC BY SA 3.0
* [Custom Google Map Style](https://snazzymaps.com/style/4105/brokka-map) by eshuz CC0 1.0

* For full list of all Grunt plugins used see package.json

License: ISC 2018
