// Service Worker - تطبيق زمزم
const CACHE_NAME = 'zamzam-app-cache-v1';
const OFFLINE_URL = './index.html';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// عند التثبيت: خزّن الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // لو فشل تخزين ملف واحد، لا توقف التثبيت بالكامل
        return Promise.resolve();
      });
    })
  );
});

// عند التفعيل: احذف أي نسخ كاش قديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// عند الطلب: شبكة أولاً (Network First) عشان الأسعار تبقى حية،
// ولو انقطع النت يرجع لآخر نسخة محفوظة بدل شاشة بيضاء فاضية
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // ما نتدخل بطلبات API الخارجية (Firebase, Worker, MetaApi...) - نتركها تفشل طبيعيًا لو النت مقطوع
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});
