import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJSON } from '../api';
import ShareButton from '../components/ShareButton';

export default function Events() {
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

  const emptyMessage = 'No events scheduled yet. Check back soon!';

  return (
    <div className="page-main">
      <section className="section">
        <div className="container">
          <h2>The notice board</h2>
          <p className="section-intro">
            These are the evenings currently scribbled onto the chalkboard in the common room.
            RSVP to save your place at the table, or <strong>Share</strong> an event with a friend
            who ought to be there too.
          </p>
          {loading && <p className="featured-empty">Loading…</p>}
          {error && <p className="featured-empty">Failed to load events.</p>}
          {!loading && !error && (
            <ul>
              {events.length === 0 ? (
                <li className="event-item">{emptyMessage}</li>
              ) : (
                events.map((event) => {
                  const capacityText = event.maxCapacity != null
                    ? `${event.rsvpCount}/${event.maxCapacity} spots`
                    : 'Open';
                  const timeLine = event.time ? ` — Time: ${event.time}` : '';
                  return (
                    <li key={event.id} className="event-item">
                      <h3>{event.title}</h3>
                      <p><strong>Date:</strong> {event.date}{timeLine}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p className={`event-capacity ${event.isFull ? 'event-capacity--full' : ''}`}>
                        {capacityText}{event.isFull ? ' (full)' : ''}
                      </p>
                      <p>{event.description}</p>
                      <div className="event-card-actions">
                        <Link
                          to={`/event/${event.id}`}
                          className={`btn btn-rsvp ${event.isFull ? 'btn--disabled' : ''}`}
                        >
                          {event.isFull ? 'Full' : 'RSVP'}
                        </Link>
                        <ShareButton eventId={event.id} className="btn btn-share" />
                      </div>
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
