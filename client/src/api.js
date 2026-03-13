export async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return response.json();
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
