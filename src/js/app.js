let map;
const markers = [];
function initMap () {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.querySelector('#map'), {
    center: {
      lat: 35.6732619,
      lng: 139.5703029
    },
    zoom: 11
  });

  for (const location of locations) {
    const newMarker = new google.maps.Marker();
    markers.push(newMarker);
    newMarker.setMap(map);
  }
}

const locations = [{
  title: 'Ghibli Museum',
  location: {
    lat: 35.696238,
    lng: 139.5704317
  },
  place_id: 'ChIJLYwD5TTuGGARBZKEP5BV4U0'
}, {
  title: 'Suginami Animation Museum',
  location: {
    lat: 35.710464,
    lng: 139.607793
  },
  place_id: 'ChIJHcI_OQruGGARM2ZKib1iU8s'
}, {
  title: 'Setagaya Literary Museum',
  location: {
    lat: 35.667077,
    lng: 139.608936
  },
  place_id: 'ChIJj3AnkIfxGGAR9iYAWfmjqQI'
}, {
  title: 'Chihiro Museum of Art',
  location: {
    lat: 35.728501,
    lng: 139.60508
  },
  place_id: 'ChIJFb-Ej37uGGARgQe0mKnvitg'
}, {
  title: 'Musashino Shiritsu Kichijoji Museum',
  location: {
    lat: 35.70502069999999,
    lng: 139.5789794
  },
  place_id: 'ChIJH9Fl00fuGGARnTG8b4_-Bng'
}, {
  title: 'Setagaya Art Museum',
  location: {
    lat: 35.631618,
    lng: 139.62202
  },
  place_id: 'ChIJtSLaI_fzGGAR8w5sxx-9PR4'
}, {
  title: 'Sadatsumamiga Museum',
  location: {
    lat: 35.70857700000001,
    lng: 139.582751
  },
  place_id: 'ChIJ9-UBIETuGGARFCR15hl-mIk'
}, {
  title: 'Tokyo Art Museum',
  location: {
    lat: 35.66078149999999,
    lng: 139.5872228
  },
  place_id: 'ChIJn-VLO73xGGARjQnHXH7u7Rc'
}, {
  title: 'National Museum of Nature and Science',
  location: {
    lat: 35.716357,
    lng: 139.7763826
  },
  place_id: 'ChIJ8Vuh65yOGGARyj4L5IBFiIk'
}, {
  title: 'National Museum of Modern Art',
  location: {
    lat: 35.6905432,
    lng: 139.7546932
  },
  place_id: 'ChIJL0kSfg2MGGARKv5KX53ZZ2Y'
}];
