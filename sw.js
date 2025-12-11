// sw.js

const CACHE_NAME = 'wolf-traval-pro-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg'
];

// ----------------------------------------------------
// 1. Offline Support: التثبيت وتخزين الملفات
// ----------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// تفعيل السيرفر وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// ----------------------------------------------------
// 2. Offline Logic: الاستجابة عند انقطاع النت
// ----------------------------------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // استراتيجية Network-first للصفحة الرئيسية (حاول نت، لو فشل هات من الكاش)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // إذا فشل النت (Offline)، اعرض الصفحة الرئيسية المخزنة
          return caches.match('./index.html');
        })
    );
    return;
  }

  // استراتيجية Cache-first للملفات والصور (الكاش أولاً لسرعة التحميل)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// ----------------------------------------------------
// 3. Push Notifications: استقبال الإشعارات
// ----------------------------------------------------
self.addEventListener('push', (event) => {
  console.log('Push received');
  
  // قراءة البيانات المرسلة أو وضع بيانات افتراضية
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Wolf TraVal';
  const options = {
    body: data.body || 'اكتشف عروضنا الجديدة الآن!',
    icon: 'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf.png',
    badge: 'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf.png',
    vibrate: [100, 50, 100],
    data: { 
      url: data.url || './index.html' 
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// التعامل مع الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // إذا كان التطبيق مفتوحاً، ركز عليه
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا كان مغلقاً، افتحه
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ----------------------------------------------------
// 4. Background Sync & Periodic Sync (باقي المتطلبات)
// ----------------------------------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('Sync event fired');
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    console.log('Periodic sync event fired');
  }
});