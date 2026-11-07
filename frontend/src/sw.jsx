import { imageCache, staticResourceCache } from 'workbox-recipes';

staticResourceCache()
imageCache();
/*
registerRoute(/^.*?archimedes.*?s3.*?.\.(?:png|gif|jpe?g|svg)$/,
  new StaleWhileRevalidate({
    cacheName: 'medes-cdn-cache',
  })
);
registerRoute(/^.*?\.(?:png|gif|jpe?g|svg)$/,
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
); 

registerRoute(/(pikaday|apexcharts|analytics.js)$/,
  new CacheFirst({
    cacheName: 'static-external-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
); */

self.addEventListener('push', function(event) {
  const payload = event.data ? event.data.json() : null;
  event.waitUntil(self.registration.showNotification(payload.title, payload));
});

self.addEventListener("notificationclick", function(event) {
  event.waitUntil(clients.openWindow(event.notification.data.link));    
});
