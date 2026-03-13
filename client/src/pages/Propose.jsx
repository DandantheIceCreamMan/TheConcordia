import { useState } from 'react';
import { fetchJSON } from '../api';

export default function Propose() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);
    const form = e.target;
    const payload = {
      name: form.name.value || undefined,
      email: form.email.value || undefined,
      idea: form.idea.value,
    };
    try {
      await fetchJSON('/api/events/ideas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage('Thank you! Your idea has been submitted.');
      form.reset();
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-main">
      <section className="section">
        <div className="container">
          <h2>Propose an evening</h2>
          <p className="section-intro">
            Every great tradition began as someone's half‑serious suggestion in a common room.
            Supper club, book salon, chess tournament, stargazing on the quad—tell us what you'd
            love to gather people for.
          </p>
          <form id="event-idea-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="idea-name">Name (optional)</label>
              <input id="idea-name" name="name" type="text" />
            </div>
            <div className="form-row">
              <label htmlFor="idea-email">Email (optional)</label>
              <input id="idea-email" name="email" type="email" />
            </div>
            <div className="form-row">
              <label htmlFor="idea-text">Your event idea</label>
              <textarea id="idea-text" name="idea" required />
            </div>
            <button type="submit" disabled={submitting}>Submit Idea</button>
            <p className="form-message">{message}</p>
          </form>
        </div>
      </section>
    </div>
  );
}
