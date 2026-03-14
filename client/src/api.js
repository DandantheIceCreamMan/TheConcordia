export async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return response.json();
}

/** Call API with admin Bearer token. Use for admin-only routes. */
export async function adminFetch(url, options = {}, adminToken) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${adminToken}`,
    },
  });
  return response;
}

export function getEventShareUrl(eventId) {
  const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '') || window.location.origin;
  return `${base}/event/${eventId}`;
}

export function isPastEvent(event) {
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate < today;
}
