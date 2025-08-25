const CACHE_NAME = 'english-partner-cache-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/services/geminiService.ts',
  '/hooks/useSpeechToText.ts',
  '/hooks/useTextToSpeech.ts',
  '/components/ConversationView.tsx',
  '/components/CorrectionCard.tsx',
  '/components/MicButton.tsx',
  '/components/StatusIndicator.tsx',
  '/components/ApiKeyBanner.tsx',
  '/components/icons/AlertTriangleIcon.tsx',
  '/components/icons/BotIcon.tsx',
  '/components/icons/CheckIcon.tsx',
  '/components/icons/LoaderIcon.tsx',
  '/components/icons/MicIcon.tsx',
  '/components/icons/SparklesIcon.tsx',
  '/components/icons/StopIcon.tsx',
  '/components/icons/UserIcon.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
          return networkResponse;
        }

        return caches.open(CACHE_NAME).then((cache) => {
          if (networkResponse && networkResponse.status === 200) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
