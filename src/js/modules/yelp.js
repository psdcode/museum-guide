// Yelp module
const yelp = (function () {
  // Helper method for selection and formatting of correct Yelp star rating img
  function getRatingImg (rating) {
    const ratingWhole = Math.floor(rating);
    const ratingHalf = (rating - ratingWhole === 0.5 ? '_half' : '');
    let imgHtml = `<img src="img/yelp_stars_reg/regular_`;
    imgHtml += `${ratingWhole}${ratingHalf}.png" srcset="img/yelp_stars_reg/`;
    imgHtml += `regular_${ratingWhole}${ratingHalf}@2x.png 2x">`;
    return imgHtml;
  }

  // Helper method for formatting search string from title
  function getSearchString (locationTitle) {
    return locationTitle.replace(/\s+/g, '+');
  }

  function getSmallerImageUrl (url) {
    return url.replace(/o\.jpg$/, 'l.jpg');
  }

  // Helper method for formatting Yelp address html string
  function getYelpAddressHtml (yelpAddress, country) {
    // Remove country from address since it's redundant in the context of a city map
    if (yelpAddress[yelpAddress.length - 1].toLowerCase() === country.toLowerCase()) {
      yelpAddress = yelpAddress.slice(0, yelpAddress.length - 1);
    }
    return yelpAddress.join('<br>');
  }

  // Helper method for inserting Yelp html into info window
  function getYelpInfoHtml (yelpInfo, country) {
    let yelpContent = `<div class="yelp">`;
    // Image
    yelpContent += `<img class="yelp__image" src=${getSmallerImageUrl(yelpInfo.image_url)} alt="Museum">`;
    // Rating & Info
    yelpContent += `<div class="yelp__info">`;
    yelpContent += `<a class="yelp__rating" href="${yelpInfo.url}" target="_blank">`;
    yelpContent += `${getRatingImg(yelpInfo.rating)}</a>`;
    yelpContent += `<a target="_blank" href="${yelpInfo.url}">`;
    yelpContent += `<img class="yelp__logo" src="img/yelp_trademark_rgb_outline.png" `;
    yelpContent += `srcset="img/yelp_trademark_rgb_outline_2x.png 2x" alt="Yelp Logo">`;
    yelpContent += `</a>`;
    yelpContent += `<a class="yelp__reviews" href="${yelpInfo.url}" target="_blank">Based `;
    yelpContent += `on <strong>${yelpInfo.review_count}</strong> review`;
    yelpContent += `${yelpInfo.review_count > 1 ? 's' : ''}</a>`;
    yelpContent += `<p><address>${getYelpAddressHtml(yelpInfo.location.display_address, country)}`;
    yelpContent += `</address></p>`;
    yelpContent += `<p class="yelp__open-now">Currently <strong>`;
    yelpContent += `${yelpInfo.is_open_now ? 'OPEN' : 'CLOSED'}</strong><br>`;
    yelpContent += `Phone: ${yelpInfo.display_phone}</p>`;
    // Close <div class="yelp__info">
    yelpContent += `</div>`;
    // Close <div class="yelp">
    yelpContent += `</div>`;

    return yelpContent;
  }

  // Helper method for fetching Yelp info
  function fetchYelp (fetchString, token) {
    return window.fetch(fetchString,
      {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${token}`
        }
      })
      .catch(err => {
        // In case connection error to cors-anywhere.herokuapp.com
        // window.alert(`Unable to retrieve this locations's Yelp data due to a \
        // connection error. Please try again later.`); TODO
        return Promise.reject(err);
      })
      .then(function (response) {
        // Both cors-anywhere.herokuapp.com and api.yelp.com reachable
        if (response.ok) {
          return response;

        // cors-anywhere.herokuapp.com ok, api.yelp.com fails
        } else {
          return Promise.reject(new Error('api.yelp.com connection error'));
        }
      })
      .then((response) => (response.json()));
  }

  function fetchYelpHours (yelpData, token) {
    // Since client-side requests to Yelp V3 API are not possible due to lack
    // of support for CORS and JSONP, 'cors-anywhere' app hack is employed as a proxy
    let fetchHoursString = `https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/`;
    fetchHoursString += `businesses/${yelpData.id}`;
    return fetchYelp(fetchHoursString, token).then(function (responseJSON) {
      const yelpDataAndHours = Object.assign(yelpData, {is_open_now: responseJSON.hours.is_open_now});
      return yelpDataAndHours;
    });
  }

  function fetchYelpInfo (mapMarker, token) {
    // Since client-side requests to Yelp V3 API are not possible due to lack
    // of support for CORS and JSONP, 'cors-anywhere' app hack is employed as a proxy
    let fetchInfoString = `https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/`;
    fetchInfoString += `businesses/search?term=${getSearchString(mapMarker.title)}&`;
    fetchInfoString += `latitude=${mapMarker.position.lat()}&longitude=`;
    fetchInfoString += `${mapMarker.position.lng()}`;
    return fetchYelp(fetchInfoString, token).then(
      (responseJSON) => (fetchYelpHours(responseJSON.businesses[0], token))
    );
  }

  // return Yelp module
  return {
    getYelpInfoHtml,
    fetchYelpInfo
  };
}());

export default yelp;
