const CACHE_NAME = 'wolf-traval-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap'
];

// Install Event (Caching static assets)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event (Cleaning old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event (Cache First strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch new
      return response || fetch(event.request);
    })
  );
});

// =======================================================
// PUSH NOTIFICATION HANDLERS (الإشعارات الخارجية)
// =======================================================

// Push Event Handler: Receives push data from the server
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  // يفضل أن يتم إرسال البيانات كـ JSON من الخادم
  let data = { title: 'Wolf TraVal', body: 'يوجد تحديث جديد في الرحلات!', url: './' }; 

  if (event.data) {
    try {
      // محاولة تحليل حمولة الإشعار كـ JSON
      data = event.data.json();
    } catch (e) {
      console.error('Push data not JSON, using default.', e);
    }
  }

  const title = data.title || 'Wolf TraVal | رحلة قادمة';
  const options = {
    body: data.body || 'اكتشف عروض السفر الجديدة الآن!',
    icon: 'https://img.icons8.com/fluency/512/airplane-take-off.png', 
    badge: 'https://img.icons8.com/fluency/512/Wolf.png', // أيقونة صغيرة تظهر على شريط النظام
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './' // الرابط الذي سيتم فتحه عند النقر
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler: Handles user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  let targetUrl = event.notification.data.url || './';

  // يضمن فتح نافذة جديدة أو التركيز على النافذة الموجودة
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});