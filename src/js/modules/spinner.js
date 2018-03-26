// Helper method for constructing InfoWindow spinner HTML
function getInfoWindowSpinnerHtml () {
  // Create [1, ... , 12]
  const arrayOneToTwelve = Array(12).fill().map((x, i) => (i + 1));

  // Spinner div element string construction
  let spinner = '<div class="sk-circle">';
  arrayOneToTwelve.forEach(function (circleNum) {
    spinner += `<div class="sk-circle${circleNum} sk-child"></div>`;
  });
  spinner += '</div>';
  return spinner;
}

export default getInfoWindowSpinnerHtml();
