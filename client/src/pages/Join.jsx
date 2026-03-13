import { useState } from 'react';
import { fetchJSON } from '../api';

export default function Join() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);
    const form = e.target;
    const payload = {
      name: form.name.value,
      email: form.email.value,
      yearOfStudy: form.yearOfStudy.value || undefined,
    };
    try {
      await fetchJSON('/api/club-signups', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage("Thanks for joining! We'll be in touch with more details.");
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
          <h2>Join Concordia</h2>
          <p className="section-intro">
            Add your name to the common-room list and we'll keep you in the loop for suppers, walks,
            parties, and calls for help moving sofas.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="signup-name">Name</label>
              <input id="signup-name" name="name" type="text" required />
            </div>
            <div className="form-row">
              <label htmlFor="signup-email">Email</label>
              <input id="signup-email" name="email" type="email" required />
            </div>
            <div className="form-row">
              <label htmlFor="signup-year">Year of study (optional)</label>
              <input id="signup-year" name="yearOfStudy" type="text" />
            </div>
            <button type="submit" disabled={submitting}>Join the society</button>
            <p className="form-message">{message}</p>
          </form>

          <hr className="join-divider" />

          <h3>Contact</h3>
          <p>
            Questions, ideas, or long letters of opinion?<br />
            Email us at <a href="mailto:club@example.edu">club@example.edu</a>
            or come find us in the common room.
          </p>
          <p><strong>Meeting place:</strong> Student Union, Room 210</p>
        </div>
      </section>
    </div>
  );
}
