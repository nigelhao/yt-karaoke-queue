const CACHE_NAME = "yt-karaoke-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/vite.svg"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});

// Fetch event - network first, then cache
self.addEventListener("fetch", (event) => {
    // Skip non-GET requests
    if (event.request.method !== "GET") return;

    // Skip YouTube API and WebSocket requests
    const url = new URL(event.request.url);
    if (
        url.hostname.includes("youtube.com") ||
        url.protocol === "ws:" ||
        url.protocol === "wss:"
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                }
                return response;
            })
            .catch(() => {
                // Return cached response if network fails
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Return offline page for navigation requests
                    if (event.request.mode === "navigate") {
                        return caches.match("/");
                    }
                    return new Response("Network error", { status: 408 });
                });
            })
    );
});

// Handle messages from the client
self.addEventListener("message", (event) => {
    if (event.data === "skipWaiting") {
        self.skipWaiting();
    }
});

// Background sync for offline queue additions
self.addEventListener("sync", (event) => {
    if (event.tag === "queueSync") {
        event.waitUntil(syncQueue());
    }
});

// Function to sync queued items when back online
async function syncQueue() {
    try {
        const db = await openDB();
        const tx = db.transaction("offlineQueue", "readwrite");
        const store = tx.objectStore("offlineQueue");
        const items = await store.getAll();

        for (const item of items) {
            try {
                const response = await fetch("/api/queue", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(item),
                });

                if (response.ok) {
                    await store.delete(item.id);
                }
            } catch (error) {
                console.error("Error syncing item:", error);
            }
        }

        await tx.complete;
    } catch (error) {
        console.error("Error in syncQueue:", error);
    }
}

// Open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("YTKaraokeQueue", 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("offlineQueue")) {
                db.createObjectStore("offlineQueue", { keyPath: "id" });
            }
        };
    });
}
