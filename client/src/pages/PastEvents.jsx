import { useEffect, useState } from 'react';
import { fetchJSON, isPastEvent } from '../api';

export default function PastEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchJSON('/api/events')
      .then((data) => {
        if (!cancelled) setEvents(data.filter(isPastEvent));
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page-main">
      <section className="section">
        <div className="container">
          <h2>Past evenings</h2>
          <p className="section-intro">
            A sampling of what has already filled the common room: the nights people still mention
            over coffee the next morning.
          </p>
          {loading && <p className="featured-empty">Loading…</p>}
          {error && <p className="featured-empty">Failed to load events.</p>}
          {!loading && !error && (
            <ul>
              {events.length === 0 ? (
                <li className="event-item">No past events yet.</li>
              ) : (
                events.map((event) => {
                  const timeLine = event.time ? ` — Time: ${event.time}` : '';
                  return (
                    <li key={event.id} className="event-item">
                      <h3>{event.title}</h3>
                      <p><strong>Date:</strong> {event.date}{timeLine}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p>{event.description}</p>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
