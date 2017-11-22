function MapViewModel () {
  this.filteredList = ko.observableArray([]);
  this.query = ko.observable();
  for (const museum of museums) {
    this.filteredList.push(museum.title);
  }
  this.filteredList.sort();

  this.consoleOut = function (input) {
    console.log(input);
  };

  this.callFindMarkerForBounce = findMarkerForBounce;
}
const currentViewModel = new MapViewModel();
currentViewModel.query.subscribe(currentViewModel.consoleOut);
ko.applyBindings(currentViewModel);
