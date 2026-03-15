import { useEffect, useState } from 'react';
import { fetchJSON, adminFetch } from '../api';

const ADMIN_TOKEN_KEY = 'concordia_admin_token';

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [eventIdeas, setEventIdeas] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [clubSignups, setClubSignups] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', date: '', time: '', location: '', description: '', maxCapacity: ''
  });
  const [eventSubmitStatus, setEventSubmitStatus] = useState({ type: '', message: '' });
  const [newsletterForm, setNewsletterForm] = useState({ title: '', content: '' });
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', message: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [pollForm, setPollForm] = useState({ question: '', optionsText: '', description: '', closesAt: '' });
  const [pollStatus, setPollStatus] = useState({ type: '', message: '' });
  const [editingPollId, setEditingPollId] = useState(null);
  const [editPollForm, setEditPollForm] = useState(null);
  const [editingNewsletterId, setEditingNewsletterId] = useState(null);
  const [editNewsletterForm, setEditNewsletterForm] = useState(null);
  const [rsvpsForEvent, setRsvpsForEvent] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [evRes, poRes, nl, ideasRes, subsRes, signupsRes, stRes] = await Promise.all([
        fetch('/api/events').then((r) => r.json()),
        adminFetch('/api/admin/polls', {}, token).then(async (r) => {
          const data = await r.json();
          return r.ok && Array.isArray(data) ? data : [];
        }),
        fetchJSON('/api/newsletters'),
        adminFetch('/api/admin/event-ideas', {}, token).then(async (r) => (r.ok ? r.json() : [])),
        adminFetch('/api/admin/subscribers', {}, token).then(async (r) => (r.ok ? r.json() : [])),
        adminFetch('/api/admin/club-signups', {}, token).then(async (r) => (r.ok ? r.json() : [])),
        adminFetch('/api/admin/stories', {}, token).then(async (r) => (r.ok ? r.json() : []))
      ]);
      setEvents(Array.isArray(evRes) ? evRes : []);
      setPolls(Array.isArray(poRes) ? poRes : []);
      setNewsletters(Array.isArray(nl) ? nl : []);
      setEventIdeas(Array.isArray(ideasRes) ? ideasRes : []);
      setSubscribers(Array.isArray(subsRes) ? subsRes : []);
      setClubSignups(Array.isArray(signupsRes) ? signupsRes : []);
      setStories(Array.isArray(stRes) ? stRes : []);
    } catch {
      setEvents([]);
      setPolls([]);
      setNewsletters([]);
      setEventIdeas([]);
      setSubscribers([]);
      setClubSignups([]);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const key = password.trim();
    if (!key) {
      setLoginError('Enter the admin key.');
      return;
    }
    try {
      const res = await adminFetch('/api/admin/check', {}, key);
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Invalid admin key.');
        return;
      }
      sessionStorage.setItem(ADMIN_TOKEN_KEY, key);
      setToken(key);
      setPassword('');
    } catch {
      setLoginError('Could not reach the server.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setPassword('');
    setLoginError('');
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setEventSubmitStatus({ type: '', message: '' });
    try {
      const res = await adminFetch('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          title: eventForm.title,
          date: eventForm.date,
          time: eventForm.time || undefined,
          location: eventForm.location,
          description: eventForm.description,
          maxCapacity: eventForm.maxCapacity === '' ? null : Number(eventForm.maxCapacity)
        })
      }, token);
      const data = await res.json();
      if (!res.ok) {
        setEventSubmitStatus({ type: 'error', message: data.error || 'Failed to add event.' });
        return;
      }
      setEvents((prev) => [...prev, data]);
      setEventForm({ title: '', date: '', time: '', location: '', description: '', maxCapacity: '' });
      setEventSubmitStatus({ type: 'success', message: 'Event added.' });
    } catch {
      setEventSubmitStatus({ type: 'error', message: 'Could not add event.' });
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingId || !editForm) return;
    setEventSubmitStatus({ type: '', message: '' });
    try {
      const res = await adminFetch(`/api/admin/events/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editForm.title,
          date: editForm.date,
          time: editForm.time || undefined,
          location: editForm.location,
          description: editForm.description,
          maxCapacity: editForm.maxCapacity === '' ? null : Number(editForm.maxCapacity)
        })
      }, token);
      const data = await res.json();
      if (!res.ok) {
        setEventSubmitStatus({ type: 'error', message: data.error || 'Failed to update event.' });
        return;
      }
      setEvents((prev) => prev.map((ev) => (ev.id === editingId ? data : ev)));
      setEditingId(null);
      setEditForm(null);
      setEventSubmitStatus({ type: 'success', message: 'Event updated.' });
    } catch {
      setEventSubmitStatus({ type: 'error', message: 'Could not update event.' });
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await adminFetch(`/api/admin/events/${id}`, { method: 'DELETE' }, token);
      if (!res.ok) {
        const data = await res.json();
        setEventSubmitStatus({ type: 'error', message: data.error || 'Failed to delete.' });
        return;
      }
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      setEventSubmitStatus({ type: 'success', message: 'Event deleted.' });
      if (editingId === id) {
        setEditingId(null);
        setEditForm(null);
      }
      if (rsvpsForEvent === id) setRsvpsForEvent(null);
    } catch {
      setEventSubmitStatus({ type: 'error', message: 'Could not delete event.' });
    }
  };

  const startEdit = (event) => {
    setEditingId(event.id);
    setEditForm({
      title: event.title,
      date: event.date,
      time: event.time || '',
      location: event.location,
      description: event.description,
      maxCapacity: event.maxCapacity != null ? String(event.maxCapacity) : ''
    });
  };

  const handleAddNewsletter = async (e) => {
    e.preventDefault();
    setNewsletterStatus({ type: '', message: '' });
    try {
      const res = await adminFetch('/api/admin/newsletters', {
        method: 'POST',
        body: JSON.stringify({ title: newsletterForm.title, content: newsletterForm.content })
      }, token);
      const data = await res.json();
      if (!res.ok) {
        setNewsletterStatus({ type: 'error', message: data.error || 'Failed to add newsletter.' });
        return;
      }
      setNewsletters((prev) => [...prev, data]);
      setNewsletterForm({ title: '', content: '' });
      setNewsletterStatus({ type: 'success', message: `Newsletter "${data.title}" published.` });
    } catch {
      setNewsletterStatus({ type: 'error', message: 'Could not add newsletter.' });
    }
  };

  const handleUpdateNewsletter = async (e) => {
    e.preventDefault();
    if (!editingNewsletterId || !editNewsletterForm) return;
    try {
      const res = await adminFetch(`/api/admin/newsletters/${editingNewsletterId}`, {
        method: 'PUT',
        body: JSON.stringify(editNewsletterForm)
      }, token);
      const data = await res.json();
      if (!res.ok) {
        setNewsletterStatus({ type: 'error', message: data.error || 'Failed to update.' });
        return;
      }
      setNewsletters((prev) => prev.map((n) => (n.id === editingNewsletterId ? data : n)));
      setEditingNewsletterId(null);
      setEditNewsletterForm(null);
      setNewsletterStatus({ type: 'success', message: 'Newsletter updated.' });
    } catch {
      setNewsletterStatus({ type: 'error', message: 'Could not update newsletter.' });
    }
  };

  const handleDeleteNewsletter = async (id) => {
    if (!window.confirm('Delete this newsletter?')) return;
    try {
      const res = await adminFetch(`/api/admin/newsletters/${id}`, { method: 'DELETE' }, token);
      if (!res.ok) {
        const data = await res.json();
        setNewsletterStatus({ type: 'error', message: data.error || 'Failed to delete.' });
        return;
      }
      setNewsletters((prev) => prev.filter((n) => n.id !== id));
      setNewsletterStatus({ type: 'success', message: 'Newsletter deleted.' });
      if (editingNewsletterId === id) {
        setEditingNewsletterId(null);
        setEditNewsletterForm(null);
      }
    } catch {
      setNewsletterStatus({ type: 'error', message: 'Could not delete.' });
    }
  };

  const handleAddPoll = async (e) => {
    e.preventDefault();
    setPollStatus({ type: '', message: '' });
    const options = pollForm.optionsText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (options.length < 2) {
      setPollStatus({ type: 'error', message: 'Enter at least two options (one per line or comma-separated).' });
      return;
    }
    try {
      const res = await adminFetch('/api/admin/polls', {
        method: 'POST',
        body: JSON.stringify({
          question: pollForm.question.trim(),
          options,
          description: pollForm.description.trim() || undefined,
          closesAt: pollForm.closesAt.trim() || undefined
        })
      }, token);
      const data = await res.json();
      if (!res.ok) {
        setPollStatus({ type: 'error', message: data.error || 'Failed to add poll.' });
        return;
      }
      setPolls((prev) => [...prev, data]);
      setPollForm({ question: '', optionsText: '', description: '', closesAt: '' });
      setPollStatus({ type: 'success', message: 'Poll added.' });
    } catch {
      setPollStatus({ type: 'error', message: 'Could not add poll.' });
    }
  };

  const handleUpdatePoll = async (e) => {
    e.preventDefault();
    if (!editingPollId || !editPollForm) return;
    const options = editPollForm.optionsText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (options.length < 2) {
      setPollStatus({ type: 'error', message: 'At least two options required.' });
      return;
    }
    setPollStatus({ type: '', message: '' });
    try {
      const res = await adminFetch(`/api/admin/polls/${editingPollId}`, {
        method: 'PUT',
        body: JSON.stringify({
          question: editPollForm.question.trim(),
          options,
          description: editPollForm.description != null ? editPollForm.description.trim() || null : undefined,
          closesAt: editPollForm.closesAt != null && editPollForm.closesAt.trim() !== '' ? editPollForm.closesAt.trim() : null
        })
      }, token);
      const data = await res.json();
      if (!res.ok) {
        setPollStatus({ type: 'error', message: data.error || 'Failed to update.' });
        return;
      }
      setPolls((prev) => prev.map((p) => (p.id === editingPollId ? data : p)));
      setEditingPollId(null);
      setEditPollForm(null);
      setPollStatus({ type: 'success', message: 'Poll updated. (Votes were reset.)' });
    } catch {
      setPollStatus({ type: 'error', message: 'Could not update poll.' });
    }
  };

  const handleDeletePoll = async (id) => {
    if (!window.confirm('Delete this poll?')) return;
    try {
      const res = await adminFetch(`/api/admin/polls/${id}`, { method: 'DELETE' }, token);
      if (!res.ok) {
        setPollStatus({ type: 'error', message: 'Failed to delete.' });
        return;
      }
      setPolls((prev) => prev.filter((p) => p.id !== id));
      setPollStatus({ type: 'success', message: 'Poll deleted.' });
      if (editingPollId === id) {
        setEditingPollId(null);
        setEditPollForm(null);
      }
    } catch {
      setPollStatus({ type: 'error', message: 'Could not delete.' });
    }
  };

  const handleEndPoll = async (id) => {
    try {
      const res = await adminFetch(`/api/admin/polls/${id}/end`, { method: 'PATCH' }, token);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPollStatus({ type: 'error', message: data.error || 'Failed to end poll.' });
        return;
      }
      const data = await res.json();
      setPolls((prev) => prev.map((p) => (p.id === id ? { ...p, closesAt: data.closesAt } : p)));
      setPollStatus({ type: 'success', message: 'Poll ended. Voting is now closed.' });
      if (editingPollId === id && editPollForm) {
        setEditPollForm((f) => ({ ...f, closesAt: data.closesAt }));
      }
    } catch {
      setPollStatus({ type: 'error', message: 'Could not end poll.' });
    }
  };

  const startEditPoll = (poll) => {
    setEditingPollId(poll.id);
    setEditPollForm({
      question: poll.question,
      optionsText: poll.options.map((o) => o.label).join('\n'),
      description: poll.description || '',
      closesAt: poll.closesAt || ''
    });
  };

  const handleDeleteIdea = async (id) => {
    if (!window.confirm('Remove this idea?')) return;
    try {
      const res = await adminFetch(`/api/admin/event-ideas/${id}`, { method: 'DELETE' }, token);
      if (!res.ok) return;
      setEventIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // ignore
    }
  };

  const handleDeleteStory = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      const res = await adminFetch(`/api/admin/stories/${id}`, { method: 'DELETE' }, token);
      if (!res.ok) return;
      setStories((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  };

  const [rsvpsDataCache, setRsvpsDataCache] = useState({});

  const loadRsvps = async (eventId) => {
    if (rsvpsForEvent === eventId) {
      setRsvpsForEvent(null);
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/events/${eventId}/rsvps`, {}, token);
      const data = await res.json();
      setRsvpsDataCache((c) => ({ ...c, [eventId]: data }));
      setRsvpsForEvent(eventId);
    } catch {
      setRsvpsDataCache((c) => ({ ...c, [eventId]: [] }));
      setRsvpsForEvent(eventId);
    }
  };

  if (!token) {
    return (
      <div className="page-main admin-portal">
        <section className="section">
          <div className="container container--narrow">
            <h2>Admin</h2>
            <p className="section-intro">
              Enter the admin key to manage the site.
            </p>
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-row">
                <label htmlFor="admin-key">Admin key</label>
                <input
                  id="admin-key"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin key"
                  autoComplete="current-password"
                />
              </div>
              <button type="submit">Access admin</button>
              {loginError && <p className="form-message form-message--error">{loginError}</p>}
            </form>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-main admin-dashboard">
      <section className="section">
        <div className="container">
          <div className="admin-header">
            <h2>Admin</h2>
            <div className="admin-header-actions">
              <button type="button" className="btn btn-share" onClick={loadAll} disabled={loading}>
                {loading ? 'Loading…' : 'Refresh all'}
              </button>
              <button type="button" className="btn btn-share" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>

          {loading && events.length === 0 && <p>Loading…</p>}

          <details className="admin-block" open>
            <summary><h3>Manage events</h3></summary>
            {events.length > 0 && (
              <ul className="admin-event-list">
                {events.map((event) => (
                  <li key={event.id} className="event-item admin-event-item">
                    <div>
                      <strong>{event.title}</strong> — {event.date}
                      {event.time && ` ${event.time}`} · {event.location}
                      {event.rsvpCount != null && (
                        <span className="admin-meta"> · {event.rsvpCount} RSVP{event.rsvpCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="event-card-actions">
                      <button type="button" className="btn btn-share" onClick={() => loadRsvps(event.id)}>
                        {rsvpsForEvent === event.id ? 'Hide RSVPs' : 'View RSVPs'}
                      </button>
                      <button type="button" className="btn btn-share" onClick={() => startEdit(event)}>Edit</button>
                      <button
                        type="button"
                        className="btn btn-rsvp"
                        style={{ background: 'var(--color-ink-muted)' }}
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {rsvpsForEvent != null && rsvpsDataCache[rsvpsForEvent] != null && (
              <div className="admin-rsvps">
                <h4>RSVPs for this event</h4>
                <ul>
                  {(rsvpsDataCache[rsvpsForEvent] || []).map((r, i) => (
                    <li key={i}>{r.name} — {r.email}</li>
                  ))}
                </ul>
              </div>
            )}
            {editingId && editForm && (
              <form onSubmit={handleUpdateEvent} className="admin-form">
                <h4>Edit event</h4>
                <div className="form-row">
                  <label>Title</label>
                  <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <label>Date</label>
                  <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <label>Time (optional)</label>
                  <input value={editForm.time} onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))} placeholder="e.g. 7:00 PM" />
                </div>
                <div className="form-row">
                  <label>Location</label>
                  <input value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} required />
                </div>
                <div className="form-row">
                  <label>Max capacity (optional)</label>
                  <input type="number" min="1" value={editForm.maxCapacity} onChange={(e) => setEditForm((f) => ({ ...f, maxCapacity: e.target.value }))} placeholder="Leave blank for no limit" />
                </div>
                <div className="event-card-actions">
                  <button type="submit" className="btn btn-rsvp">Save</button>
                  <button type="button" className="btn btn-share" onClick={() => { setEditingId(null); setEditForm(null); }}>Cancel</button>
                </div>
              </form>
            )}
            <form onSubmit={handleAddEvent} className="admin-form">
              <h4>Add event</h4>
              <div className="form-row">
                <label>Title</label>
                <input value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>Date</label>
                <input type="date" value={eventForm.date} onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>Time (optional)</label>
                <input value={eventForm.time} onChange={(e) => setEventForm((f) => ({ ...f, time: e.target.value }))} placeholder="e.g. 7:00 PM" />
              </div>
              <div className="form-row">
                <label>Location</label>
                <input value={eventForm.location} onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>Description</label>
                <textarea value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} rows={3} required />
              </div>
              <div className="form-row">
                <label>Max capacity (optional)</label>
                <input type="number" min="1" value={eventForm.maxCapacity} onChange={(e) => setEventForm((f) => ({ ...f, maxCapacity: e.target.value }))} placeholder="Leave blank for no limit" />
              </div>
              <button type="submit" className="btn btn-rsvp">Add event</button>
              {eventSubmitStatus.message && (
                <p className={`form-message ${eventSubmitStatus.type === 'error' ? 'form-message--error' : ''}`}>{eventSubmitStatus.message}</p>
              )}
            </form>
          </details>

          <details className="admin-block">
            <summary><h3>Polls</h3></summary>
            {polls.length > 0 && (
              <ul className="admin-event-list">
                {polls.map((poll) => {
                  const totalVotes = poll.totalVotes ?? poll.options?.reduce((s, o) => s + (o.votes ?? 0), 0) ?? 0;
                  const isClosed = poll.closesAt && new Date(poll.closesAt) < new Date();
                  return (
                    <li key={poll.id} className="event-item admin-event-item admin-poll-item">
                      <div className="admin-poll-head">
                        <strong>{poll.question}</strong>
                        <span className="admin-poll-total">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} total</span>
                        {isClosed && <span className="admin-poll-closed">Closed</span>}
                      </div>
                      <ul className="admin-poll-results">
                        {poll.options.map((o) => (
                          <li key={o.id}>
                            <span className="admin-poll-option-label">{o.label}</span>
                            <span className="admin-poll-votes">{o.votes ?? 0} votes</span>
                          </li>
                        ))}
                      </ul>
                      <div className="event-card-actions">
                        <button type="button" className="btn btn-share" onClick={() => startEditPoll(poll)}>Edit</button>
                        {!isClosed && (
                          <button type="button" className="btn btn-share" onClick={() => handleEndPoll(poll.id)}>End poll now</button>
                        )}
                        <button type="button" className="btn btn-rsvp" style={{ background: 'var(--color-ink-muted)' }} onClick={() => handleDeletePoll(poll.id)}>Delete</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {editingPollId && editPollForm && (
              <form onSubmit={handleUpdatePoll} className="admin-form">
                <h4>Edit poll</h4>
                <div className="form-row">
                  <label>Question</label>
                  <input value={editPollForm.question} onChange={(e) => setEditPollForm((f) => ({ ...f, question: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <label>Description (optional)</label>
                  <textarea value={editPollForm.description ?? ''} onChange={(e) => setEditPollForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Extra context for voters" />
                </div>
                <div className="form-row">
                  <label>Closes at (optional — date and time)</label>
                  <input type="datetime-local" value={editPollForm.closesAt ? String(editPollForm.closesAt).slice(0, 16) : ''} onChange={(e) => setEditPollForm((f) => ({ ...f, closesAt: e.target.value || null }))} />
                </div>
                <div className="form-row">
                  <label>Options (one per line or comma-separated)</label>
                  <textarea value={editPollForm.optionsText} onChange={(e) => setEditPollForm((f) => ({ ...f, optionsText: e.target.value }))} rows={4} required />
                </div>
                <p className="form-message">Editing options resets vote counts.</p>
                <div className="event-card-actions">
                  <button type="submit" className="btn btn-rsvp">Save</button>
                  <button type="button" className="btn btn-share" onClick={() => { setEditingPollId(null); setEditPollForm(null); }}>Cancel</button>
                </div>
              </form>
            )}
            <form onSubmit={handleAddPoll} className="admin-form">
              <h4>Add poll</h4>
              <div className="form-row">
                <label>Question</label>
                <input value={pollForm.question} onChange={(e) => setPollForm((f) => ({ ...f, question: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>Description (optional)</label>
                <textarea value={pollForm.description} onChange={(e) => setPollForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Extra context for voters" />
              </div>
              <div className="form-row">
                <label>Closes at (optional — date and time)</label>
                <input type="datetime-local" value={pollForm.closesAt} onChange={(e) => setPollForm((f) => ({ ...f, closesAt: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Options (one per line or comma-separated)</label>
                <textarea value={pollForm.optionsText} onChange={(e) => setPollForm((f) => ({ ...f, optionsText: e.target.value }))} rows={4} placeholder="Game Night, Outdoor Picnic, Movie Marathon" required />
              </div>
              <button type="submit" className="btn btn-rsvp">Add poll</button>
              {pollStatus.message && (
                <p className={`form-message ${pollStatus.type === 'error' ? 'form-message--error' : ''}`}>{pollStatus.message}</p>
              )}
            </form>
          </details>

          <details className="admin-block">
            <summary><h3>Newsletters</h3></summary>
            {newsletters.length > 0 && (
              <ul className="admin-event-list">
                {newsletters.map((n) => (
                  <li key={n.id} className="event-item admin-event-item">
                    <div><strong>{n.title}</strong> — {n.date}</div>
                    <div className="event-card-actions">
                      <button type="button" className="btn btn-share" onClick={() => { setEditingNewsletterId(n.id); setEditNewsletterForm({ title: n.title, content: n.content, date: n.date }); }}>Edit</button>
                      <button type="button" className="btn btn-rsvp" style={{ background: 'var(--color-ink-muted)' }} onClick={() => handleDeleteNewsletter(n.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {editingNewsletterId && editNewsletterForm && (
              <form onSubmit={handleUpdateNewsletter} className="admin-form">
                <h4>Edit newsletter</h4>
                <div className="form-row">
                  <label>Title</label>
                  <input value={editNewsletterForm.title} onChange={(e) => setEditNewsletterForm((f) => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <label>Date</label>
                  <input type="date" value={editNewsletterForm.date} onChange={(e) => setEditNewsletterForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label>Content</label>
                  <textarea value={editNewsletterForm.content} onChange={(e) => setEditNewsletterForm((f) => ({ ...f, content: e.target.value }))} rows={6} required />
                </div>
                <div className="event-card-actions">
                  <button type="submit" className="btn btn-rsvp">Save</button>
                  <button type="button" className="btn btn-share" onClick={() => { setEditingNewsletterId(null); setEditNewsletterForm(null); }}>Cancel</button>
                </div>
              </form>
            )}
            <form onSubmit={handleAddNewsletter} className="admin-form">
              <h4>Publish new newsletter</h4>
              <div className="form-row">
                <label>Title</label>
                <input value={newsletterForm.title} onChange={(e) => setNewsletterForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>Content</label>
                <textarea value={newsletterForm.content} onChange={(e) => setNewsletterForm((f) => ({ ...f, content: e.target.value }))} rows={6} required />
              </div>
              <button type="submit" className="btn btn-rsvp">Publish</button>
              {newsletterStatus.message && (
                <p className={`form-message ${newsletterStatus.type === 'error' ? 'form-message--error' : ''}`}>{newsletterStatus.message}</p>
              )}
            </form>
          </details>

          <details className="admin-block">
            <summary><h3>Event ideas ({eventIdeas.length})</h3></summary>
            <p className="section-intro">Submitted from the Propose page. Remove when done.</p>
            {eventIdeas.length === 0 && <p>No ideas yet.</p>}
            <ul className="admin-event-list">
              {eventIdeas.map((i) => (
                <li key={i.id} className="event-item">
                  <div><strong>{i.name || 'Anonymous'}</strong>{i.email && ` — ${i.email}`}</div>
                  <p>{i.idea}</p>
                  <button type="button" className="btn btn-share" onClick={() => handleDeleteIdea(i.id)}>Remove</button>
                </li>
              ))}
            </ul>
          </details>

          <details className="admin-block">
            <summary><h3>Newsletter subscribers ({subscribers.length})</h3></summary>
            {subscribers.length === 0 && <p>No subscribers yet.</p>}
            <ul className="admin-list-simple">
              {subscribers.map((s) => (
                <li key={s.id}>{s.email}</li>
              ))}
            </ul>
          </details>

          <details className="admin-block">
            <summary><h3>Club signups ({clubSignups.length})</h3></summary>
            {clubSignups.length === 0 && <p>No signups yet.</p>}
            <ul className="admin-event-list">
              {clubSignups.map((s) => (
                <li key={s.id} className="event-item">
                  <strong>{s.name}</strong> — {s.email}{s.yearOfStudy ? ` · ${s.yearOfStudy}` : ''}
                </li>
              ))}
            </ul>
          </details>

          <details className="admin-block">
            <summary><h3>Stories ({stories.length})</h3></summary>
            <p className="section-intro">Submitted from the Newsletter page.</p>
            {stories.length === 0 && <p>No stories yet.</p>}
            <ul className="admin-event-list">
              {stories.map((s) => (
                <li key={s.id} className="event-item">
                  <div><strong>{s.name || 'Anonymous'}</strong>{s.email && ` — ${s.email}`}</div>
                  <p>{s.story}</p>
                  <button type="button" className="btn btn-share" onClick={() => handleDeleteStory(s.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    </div>
  );
}
