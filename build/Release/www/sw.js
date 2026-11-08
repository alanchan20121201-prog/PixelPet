// ============================================================
// sw.js —— Service Worker（離線快取）
// ------------------------------------------------------------
// 用途：攔截網頁請求，將素材快取到本機，實現離線可用。
//       PixelPet 是桌面應用，本機已有全部檔案，
//       此 Service Worker 主要為瀏覽器模式提供離線支援。
// 依賴：無
// ============================================================

// CACHE_NAME：快取版本號，更新素材時改版本號可清除舊快取
var CACHE_NAME = 'pixelpet-v1.0.0';

// CACHE_FILES：需要快取的檔案清單
var CACHE_FILES = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json',
  './favicon.ico',
  './js/config.js',
  './js/storage.js',
  './js/pet.js',
  './js/stats.js',
  './js/assets-loader.js',
  './js/sprites.js',
  './js/renderer.js',
  './js/ui.js',
  './js/interactions.js',
  './js/dialogue.js',
  './js/events.js',
  './js/growth.js',
  './js/diary.js',
  './js/audio.js',
  './assets/sprites/pet-sheet.png',
  './assets/sprites/pet-portrait.png',
  './assets/scenes/room-bedroom.png',
  './assets/scenes/room-livingroom.png',
  './assets/scenes/room-garden.png',
  './assets/scenes/walk-park.png',
  './assets/scenes/walk-beach.png',
  './assets/scenes/walk-forest.png',
  './assets/ui/icon-512.png',
  './assets/ui/icon-192.png',
  './assets/ui/buttons.png',
  './assets/effects/particles.png',
  './assets/cards/status-card-bg.png',
  './assets/audio/bgm-day.ogg',
  './assets/audio/bgm-night.ogg',
  './assets/audio/bgm-walk.ogg',
  './assets/audio/sfx-levelup.ogg',
  './assets/audio/sfx-eat.ogg',
  './assets/audio/sfx-clean.ogg',
  './assets/audio/sfx-sleep.ogg',
  './assets/audio/sfx-click.ogg',
  './assets/audio/sfx-event.ogg',
  './assets/audio/sfx-happy.ogg',
  './assets/audio/sfx-hungry.ogg',
  './assets/audio/sfx-rare.ogg'
];

// ----------------------------------------------------------
// install：Service Worker 安裝事件
// 將全部檔案存入快取
// ----------------------------------------------------------
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // addAll 會抓取全部檔案並存入快取
      return cache.addAll(CACHE_FILES);
    }).then(function () {
      // skipWaiting 讓新 SW 立即生效，不等舊的結束
      return self.skipWaiting();
    })
  );
});

// ----------------------------------------------------------
// activate：Service Worker 啟用事件
// 清除舊版本快取
// ----------------------------------------------------------
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (name) {
          // 不是目前版本的快取就刪除
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(function () {
      // claim 讓 SW 立即控制所有頁面
      return self.clients.claim();
    })
  );
});

// ----------------------------------------------------------
// fetch：攔截網頁請求
// 有快取就用快取，沒有就去網路抓
// ----------------------------------------------------------
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // 快取有就回傳快取，否則去網路抓
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
