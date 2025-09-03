// public/service-worker.js
const CACHE_NAME = "bingo-audio-v1";
const AUDIO_ASSETS = [
  "/game/shuffle.m4a",
  "/game/start_game.m4a",
  "/game/pause_game.m4a",
  // Bingo calls B1–O75
  ...Array.from({ length: 75 }, (_, i) => {
    const num = i + 1;
    if (num <= 15) return `/voicemale/b_${num}.m4a`;
    if (num <= 30) return `/voicemale/i_${num}.m4a`;
    if (num <= 45) return `/voicemale/n_${num}.m4a`;
    if (num <= 60) return `/voicemale/g_${num}.m4a`;
    return `/voicemale/o_${num}.m4a`;
  }),
];

// Install: cache all sounds
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Caching audio assets...");
      return cache.addAll(AUDIO_ASSETS);
    })
  );
});

// Fetch: serve from cache first
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
