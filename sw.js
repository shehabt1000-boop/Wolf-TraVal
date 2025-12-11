const CACHE_NAME = 'wolf-traval-ultra-v7';

// قائمة الملفات التي سيتم تخزينها للعمل بدون إنترنت (تتضمن الصور الجديدة)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  // الصور المطلوبة للعمل أوفلاين
  'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg',
  'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf.png',
  'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf2.png'
];

// 1. التثبيت (Install) - تخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('جاري تخزين ملفات التطبيق للعمل بدون إنترنت...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. التفعيل (Activate) - تنظيف الكاش القديم
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

// 3. جلب البيانات (Fetch) - هذا هو الجزء المسؤول عن Offline Support
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // استثناء لخدمات جوجل وفايربيس لأنها تحتاج إنترنت دائماً
  if (requestUrl.href.includes('firebase') || requestUrl.href.includes('firestore') || requestUrl.href.includes('googleapis')) {
    return;
  }

  // التعامل مع Share Target (استقبال المشاركة)
  if (event.request.method === 'POST' && requestUrl.pathname.includes('/index.html')) {
    event.respondWith(
      Response.redirect('./index.html?share=success')
    );
    return;
  }

  // استراتيجية التعامل مع الطلبات (Network First, fallback to Cache)
  // حاول الاتصال بالنت، لو فشل (أوفلاين) هات من الكاش
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // إذا فشل النت، نبحث في الكاش
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          } else if (event.request.mode === 'navigate') {
            // إذا لم نجد الصفحة وكانت زيارة لصفحة HTML، نعيد الصفحة الرئيسية
            return caches.match('./index.html');
          }
        });
      })
  );
});

// 4. الإشعارات (Push Notifications)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Wolf TraVal';
  const options = {
    body: data.body || 'لديك إشعار جديد من ولف ترافيل',
    icon: 'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf.png',
    badge: 'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './index.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data ? event.notification.data.url : './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 6. Background Sync (مزامنة الخلفية)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('Background Sync Active');
  }
});