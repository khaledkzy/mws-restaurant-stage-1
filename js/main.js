let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

let restaurantAlt = {
  1: "Restaurant - People eating in a chinese restaurant",
	2: "Restaurant - A picture of a pizza",
	3: "Restaurant- A picture of an empty  restaurant",
	4: "Restaurant - A picture of an outside view of a resturant",
	5: "Restaurant - A picture of people eating inside a restaurant",
	6: "Restaurant - A picture of people eating inside a restaurant ",
	7: "Restaurant - A picture of an outside view of a restaurant called  Supe Riority Burger ",
	8: "Restaurant - A picture with a restuarant called the Dutch",
	9: "Restaurant - People eating in a restaurant",
	10: "Restaurant - A picture with an empty restaurant",
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});



/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}
localfetchNeighborhoods = () => {
  DBHelper.localfetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}



/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurantAlt[restaurant.id];
  li.append(image);

  const name = document.createElement('h2');
  name.tabIndex = 0;
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

// Regestering the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js');
    console.log("SW has been registered succesfully")
  });
}


// INDEXDB
// var db;
// var newItem = [
//   { taskTitle: "", hours: 0, minutes: 0, day: 0, month: "", year: 0, notified: "no" }]

// document.addEventListener('DOMContentLoaded', function () {
//   var request = window.indexedDB.open("MyTestDatabase", 5);
//   request.onupgradeneeded = function (event) {
//     var db = event.target.result;
//     var objectStore = db.createObjectStore("restaurant-data", { keyPath: "id" });
//     objectStore.createIndex("hours", "hours", { unique: false });
//     objectStore.createIndex("minutes", "minutes", { unique: false });
//     objectStore.createIndex("day", "day", { unique: false });
//     objectStore.createIndex("month", "month", { unique: false });
//     objectStore.createIndex("year", "year", { unique: false });
//     objectStore.createIndex("notified", "notified", { unique: false });
//   };
//   request.onerror = function (event) {
//     console.log(event)
//   };
//   request.onsuccess = function (event) {
//     console.log(event)
//   }
// }, false);
// setTimeout(function () {
//   var newItem = [
//     { taskTitle: "title.value", hours: "hours.value", minutes: "minutes.value", day: "day.value", month: "month.value", year: "year.value", notified: "no" }
//   ];
//   var transaction = db.transaction(["restaurant-data"], "readwrite");
//   transaction.oncomplete = function(event) {
//   console.log("khaled");
//   };
//   var store = transaction.objectStore("restaurant-data")
//   var customer = { name: "Khaled" }
//   var request = store.put(customer)
//   var objectStoreRequest = objectStore.add(newItem[0]);
//   objectStoreRequest.onsuccess = function (event) {console.log("it is working")}
//   request.onerror = function (event) {
//     console.log('NOTWORKING')
//   };
//   request.onsuccess = function (event) {
//     console.log("SAVED YAAAAY")
//   }
// }, 5000);


