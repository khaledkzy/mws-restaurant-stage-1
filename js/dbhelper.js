/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    return `http://localhost:1337`;
  }

  static get RESTAURANTS_URL() {
    return `http://localhost:1337/restaurants`;
  }

  static get REVIEWS_URL() {
    return `http://localhost:1337/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    return DBHelper.localGetRestaurants().then(response => {
      if (response) {
        DBHelper.getRestaurants()
        return callback(null, response)
      }
      return DBHelper.getRestaurants(callback)
    })
  }
  static cacheRestaurants(restaurants) {
    return localforage.setItem('restaurants', restaurants)
  }
  static localGetRestaurants(callback) {
    return localforage.getItem('restaurants')
  }
  static getRestaurants(callback = () => null) {
    return fetch(DBHelper.RESTAURANTS_URL).then(res => res.json())
      .then(json => {
        DBHelper.cacheRestaurants(json)
        return callback(null, json)
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return ('./restaurant.html?id=' + restaurant.id);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return ('/img/' + restaurant.id + '.jpg');
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }


  static getReviewsForRestaurant(restaurantId, callback) {
    this.getReviewsForRestaurantLocally(restaurantId)
      .then(response => {
        if (response) {
          DBHelper.getReviewsForRestaurantRemotely(restaurantId)
          return callback(null, response)
        }
        return DBHelper.getReviewsForRestaurantRemotely(
          restaurantId,
          callback
        )
      })

  }

  static saveReviewsForRestaurant(restaurantId, reviews) {
    return localforage.setItem(
      `reviewsForRestaurant${restaurantId}`,
      reviews
    )
  }

  static saveSingleReviewForRestaurant(review) {
    const key =
      this.getReviewsForRestaurantLocally(review.restaurant_id)
        .then(reviews => {
          localforage.setItem(
            `reviewsForRestaurant${review.restaurant_id}`,
            [...reviews, { ...review, updatedAt: new Date() }]
          )
        })
  }

  static getReviewsForRestaurantLocally(restaurantId) {
    return localforage.getItem(`reviewsForRestaurant${restaurantId}`)
  }

  static getReviewsForRestaurantRemotely(restaurantId, callback = () => null) {
    return fetch(`${this.REVIEWS_URL}/?restaurant_id=${restaurantId}`)
      .then(data => data.json())
      .then(reviews => {
        this.saveReviewsForRestaurant(restaurantId, reviews)
        callback(null, reviews)
      })
      .catch(error => callback(error, null))
  }
  static submitOrSyncReview(review) {
    this.submitRestaurantReview(review)
      .catch(() => this.sendReviewSyncRequest(review))
  }

  static submitRestaurantReview(review) {
    const options = {
      method: 'POST',
      body: JSON.stringify(review)
    }
    return fetch(this.REVIEWS_URL, options)
  }
  static sendReviewSyncRequest(review) {
    if (navigator.serviceWorker) {
      console.log('REQUESTING REVIEW SYNC')
      this.storeReview(review)
      navigator.serviceWorker.ready
        .then(reg => reg.sync.register('syncReviews'))
    }
  }

  static storeReview(review) {
    console.log('STORING REVIEW')
    localforage.getItem('reviewsToSend')
      .then(response => {
        const reviews = response || []
        localforage.setItem('reviewsToSend', [...reviews, review])
      })
  }

  static sendStoredReviews() {
    console.log('SENDING REVIEWS')
    localforage.getItem('reviewsToSend')
      .then(response => {
        const reviews = response || []
        console.log('REVIEWS: ', reviews)
        for (const review of reviews) {
          this.submitRestaurantReview(review)
        }
        localforage.setItem('reviewsToSend', [])
      })
  }

  // Regestering the service worker

  static initServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/service-worker.js').then(() => {
          navigator.serviceWorker.addEventListener('message', message => {
            message.data.action === 'postReviews' &&
              DBHelper.sendStoredReviews()
          })
        })
        console.log("SW has been registered succesfully")
      });
    }
  }


}

