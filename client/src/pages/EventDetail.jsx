import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchJSON, getEventShareUrl } from '../api';
import ShareButton from '../components/ShareButton';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [formHidden, setFormHidden] = useState(false);
  const [capacityDisplay, setCapacityDisplay] = useState(null);

  useEffect(() => {
    const eventId = id ? Number(id) : null;
    if (!eventId) {
      navigate('/events');
      return;
    }
    let cancelled = false;
    fetchJSON(`/api/events/${eventId}`)
      .then((data) => {
        if (!cancelled) setEvent(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, navigate]);

  const handleRsvp = async (e) => {
    e.preventDefault();
    setRsvpMessage('');
    const form = e.target;
    const payload = {
      name: form.name.value,
      email: form.email.value,
    };
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setRsvpMessage(data.error || 'Something went wrong. Try again.');
        return;
      }
      setRsvpMessage("You're on the list! We'll see you there.");
      form.reset();
      setFormHidden(true);
      setCapacityDisplay(
        data.maxCapacity != null
          ? `${data.rsvpCount}/${data.maxCapacity} spots`
          : `${data.rsvpCount} going`
      );
    } catch (err) {
      setRsvpMessage('Something went wrong. Try again.');
    }
  };

  if (loading) return <div className="page-main"><section className="section"><div className="container"><p>Loading event…</p></div></section></div>;
  if (error || !event) {
    if (!event && !loading) setTimeout(() => navigate('/events'), 1500);
    return (
      <div className="page-main">
        <section className="section">
          <div className="container">
            <p className="back-link"><Link to="/events">← All events</Link></p>
            <p>Event not found.</p>
          </div>
        </section>
      </div>
    );
  }

  const timeLine = event.time ? ` — Time: ${event.time}` : '';
  const capacityText = capacityDisplay ?? (event.maxCapacity != null
    ? `${event.rsvpCount}/${event.maxCapacity} spots`
    : 'Open');
  const showFull = !capacityDisplay && event.isFull;

  return (
    <div className="page-main">
      <section className="section">
        <div className="container">
          <p className="back-link"><Link to="/events">← All events</Link></p>
          <article className="event-single">
            <h2>{event.title}</h2>
            <p><strong>Date:</strong> {event.date}{timeLine}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p className={`event-capacity ${showFull ? 'event-capacity--full' : ''}`}>
              {capacityText}{showFull ? ' (full)' : ''}
            </p>
            <p>{event.description}</p>
          </article>

          {!event.isFull && (
            <div className="event-rsvp-area" hidden={formHidden}>
              <h3>RSVP</h3>
              <form onSubmit={handleRsvp}>
                <div className="form-row">
                  <label htmlFor="rsvp-name">Name</label>
                  <input id="rsvp-name" name="name" type="text" required />
                </div>
                <div className="form-row">
                  <label htmlFor="rsvp-email">Email</label>
                  <input id="rsvp-email" name="email" type="email" required />
                </div>
                <button type="submit">I'm in</button>
                <p className="form-message">{rsvpMessage}</p>
              </form>
            </div>
          )}

          <div className="event-share-area">
            <h3>Share this event</h3>
            <p className="event-share-hint">Send this link to a friend so they can see the event and RSVP.</p>
            <div className="share-link-box">
              <input
                type="text"
                readOnly
                value={getEventShareUrl(event.id)}
                aria-label="Shareable event URL"
              />
              <ShareButton eventId={event.id} className="copy-btn">Copy link</ShareButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
