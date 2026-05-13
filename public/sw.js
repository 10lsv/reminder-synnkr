// Service Worker — handles push notifications and click-through.
// Lives at /sw.js so its scope is the full origin.

self.addEventListener("install", (event) => {
  // Activate immediately on first install so push starts working on first visit
  // after subscription, without requiring a tab close/reopen cycle.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Reminder", body: event.data.text() };
  }

  const title = payload.title ?? "Reminder";
  const options = {
    body: payload.body ?? "",
    icon: "/apple-icon",
    badge: "/apple-icon",
    data: { url: payload.url ?? "/rappels" },
    tag: payload.reminderId ?? undefined,
    renotify: Boolean(payload.reminderId),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/rappels";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // If a window is already open on our origin, focus it and navigate.
      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch {
              // Cross-origin or navigation refused — fall back to opening fresh.
              await self.clients.openWindow(targetUrl);
            }
          }
          return;
        }
      }

      // No window open → open a new one.
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
