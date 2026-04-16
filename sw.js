// Service Worker minimale — serve solo per abilitare l'installazione PWA
// Non cacha nulla: il progetto gira sempre in locale su python3 server

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
