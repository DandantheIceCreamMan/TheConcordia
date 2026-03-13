import { useEffect, useState } from 'react';
import { fetchJSON } from '../api';

export default function Newsletter() {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [storyMessage, setStoryMessage] = useState('');
  const [submittingSub, setSubmittingSub] = useState(false);
  const [submittingStory, setSubmittingStory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchJSON('/api/newsletters')
      .then((data) => {
        if (!cancelled) setNewsletters(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubscribeMessage('');
    setSubmittingSub(true);
    const email = e.target.email.value;
    try {
      const result = await fetchJSON('/api/newsletters/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubscribeMessage(result.message || 'Subscribed!');
      e.target.reset();
    } catch (err) {
      setSubscribeMessage('Something went wrong. Please try again.');
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleStory = async (e) => {
    e.preventDefault();
    setStoryMessage('');
    setSubmittingStory(true);
    const form = e.target;
    const payload = {
      name: form.name.value || undefined,
      email: form.email.value || undefined,
      story: form.story.value,
    };
    try {
      const result = await fetchJSON('/api/stories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoryMessage(result.message || "Thanks for your story!");
      form.reset();
    } catch (err) {
      setStoryMessage('Something went wrong. Please try again.');
    } finally {
      setSubmittingStory(false);
    }
  };

  return (
    <div className="page-main">
      <section className="section">
        <div className="container">
          <h2>Common Room Chronicle</h2>
          <div className="newsletter-layout">
            <div className="newsletter-subscribe">
              <h3>Subscribe</h3>
              <p>
                Receive termly missives from the common room—announcements, recaps, and the
                occasional over‑dramatic anecdote.
              </p>
              <form onSubmit={handleSubscribe}>
                <div className="form-row">
                  <label htmlFor="newsletter-email">Email</label>
                  <input id="newsletter-email" name="email" type="email" required />
                </div>
                <button type="submit" disabled={submittingSub}>Subscribe</button>
                <p className="form-message">{subscribeMessage}</p>
              </form>
            </div>
            <div className="newsletter-archive">
              <h3>Newsletter Archive</h3>
              {loading && <p>Loading…</p>}
              {error && <p>Failed to load newsletters.</p>}
              {!loading && !error && (
                <ul>
                  {newsletters.length === 0 ? (
                    <li>No newsletters published yet.</li>
                  ) : (
                    newsletters.map((n) => (
                      <li key={n.id} className="newsletter-item">
                        <h4>{n.title}</h4>
                        <p className="newsletter-date">{n.date}</p>
                        <p>{n.content}</p>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="newsletter-story">
            <h3>Submit a story</h3>
            <p>
              Did a conversation wander somewhere marvellous? Did a game night or museum walk
              turn into a story worth retelling? Send it in—you might find it immortalised in
              the next Chronicle.
            </p>
            <form onSubmit={handleStory}>
              <div className="form-row">
                <label htmlFor="story-name">Name (optional)</label>
                <input id="story-name" name="name" type="text" />
              </div>
              <div className="form-row">
                <label htmlFor="story-email">Email (optional)</label>
                <input id="story-email" name="email" type="email" />
              </div>
              <div className="form-row">
                <label htmlFor="story-text">Your story</label>
                <textarea id="story-text" name="story" rows={5} required />
              </div>
              <button type="submit" disabled={submittingStory}>Submit story</button>
              <p className="form-message form-message--story">{storyMessage}</p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
