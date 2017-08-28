var CACHE_NAME = 'sheCs_cache';
var urlsToCache = [
  'index.html',
  'style.css',
  'source.js',
  'p4wn-engine.js',
  'vue.min.js',
  'vuex.min.js',
  'manifest.json',
  'img/white_king.svg',
  'img/white_queen.svg',
  'img/white_bishop.svg',
  'img/white_rook.svg',
  'img/white_knight.svg',
  'img/white_pawn.svg',
  'img/black_king.svg',
  'img/black_queen.svg',
  'img/black_bishop.svg',
  'img/black_rook.svg',
  'img/black_knight.svg',
  'img/black_pawn.svg',
];

self.addEventListener('install', function(event) {
    event.waitUntil( caches.open(CACHE_NAME).then( function (cache) {
            return cache.addAll(urlsToCache);
    }));
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        var fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(
          function(response) {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
    );
});
