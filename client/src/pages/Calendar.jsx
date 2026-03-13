import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJSON } from '../api';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchJSON('/api/events')
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const byMonth = {};
  events.forEach((event) => {
    const d = new Date(event.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(event);
  });
  const months = Object.keys(byMonth).sort();

  return (
    <div className="page-main">
      <section className="section">
        <div className="container">
          <h2>Term calendar</h2>
          <p className="section-intro">
            A bird's‑eye view of the term: salons, suppers, walks, and entirely unserious schemes.
            Click through to see the details and RSVP.
          </p>
          {loading && <p className="calendar-empty">Loading…</p>}
          {error && <p className="calendar-empty">Failed to load calendar.</p>}
          {!loading && !error && months.length === 0 && (
            <p className="calendar-empty">No events with dates yet.</p>
          )}
          {!loading && !error && months.length > 0 && months.map((key) => {
            const [year, month] = key.split('-').map(Number);
            const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
            const list = byMonth[key].sort((a, b) => new Date(a.date) - new Date(b.date));
            return (
              <div key={key} className="calendar-month">
                <h3>{monthName}</h3>
                <ul className="calendar-events">
                  {list.map((event) => {
                    const timeLine = event.time ? ` · ${event.time}` : '';
                    return (
                      <li key={event.id}>
                        <Link to={`/event/${event.id}`}>{event.title}</Link> — {event.date}{timeLine}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
