import { useEffect, useState } from 'react';
import { fetchJSON } from '../api';

function formatNewsletterDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function Newsletter() {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [storyMessage, setStoryMessage] = useState('');
  const [submittingSub, setSubmittingSub] = useState(false);
  const [submittingStory, setSubmittingStory] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchJSON('/api/newsletters')
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const sorted = [...list].sort((a, b) => {
          const da = a.date ? new Date(a.date).getTime() : 0;
          const db = b.date ? new Date(b.date).getTime() : 0;
          if (db !== da) return db - da;
          return (b.id ?? 0) - (a.id ?? 0);
        });
        setNewsletters(sorted);
      })
      .catch(() => {
        if (!cancelled) setError(true);
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
    } catch {
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
    } catch {
      setStoryMessage('Something went wrong. Please try again.');
    } finally {
      setSubmittingStory(false);
    }
  };

  const latest = !loading && !error && newsletters.length > 0 ? newsletters[0] : null;

  return (
    <div className="page-main newsletter-page">
      <section className="section">
        <div className="container newsletter-container">
          <header className="newsletter-page-header">
            <h1 className="newsletter-page-title">Concordia</h1>
            <p className="newsletter-page-intro">
              Termly missives from the common room—announcements, recaps, and the occasional over‑dramatic anecdote. Subscribe to receive them by owl post.
            </p>
          </header>

          <div className="newsletter-layout">
            <div className="newsletter-main-column">
              <div className="chronicle-archive">
                <h2 className="chronicle-archive-title">Latest edition</h2>
                {loading && <p className="chronicle-loading">Loading edition…</p>}
                {error && <p className="chronicle-error">Failed to load newsletters.</p>}
                {!loading && !error && !latest && (
                  <p className="chronicle-empty">No editions published yet. Check back after the next meeting.</p>
                )}
                {latest && (
                  <>
                    <button
                      type="button"
                      className="chronicle-teaser"
                      onClick={() => setIsOpen(true)}
                    >
                      <div className="chronicle-teaser-inner">
                        {latest.masthead && (
                          <div className="chronicle-masthead" aria-hidden>{latest.masthead}</div>
                        )}
                        <h3 className="chronicle-headline">{latest.title}</h3>
                        <p className="chronicle-date">{formatNewsletterDate(latest.date)}</p>
                        <p className="chronicle-teaser-copy">
                          {(latest.sections && latest.sections[0] && latest.sections[0].body)
                            ? latest.sections[0].body.split('\n')[0]
                            : "Open this term's Chronicle to read the full dispatch."}
                        </p>
                      </div>
                    </button>

                    <div className="newsletter-subscribe-inline">
                      {!subscribeOpen && (
                        <button
                          type="button"
                          className="btn-chronicle newsletter-subscribe-toggle"
                          onClick={() => setSubscribeOpen(true)}
                        >
                          Subscribe to Concordia
                        </button>
                      )}
                      {subscribeOpen && (
                        <div className="newsletter-subscribe-block newsletter-subscribe-card">
                          <button
                            type="button"
                            className="newsletter-subscribe-close"
                            aria-label="Close subscribe form"
                            onClick={() => setSubscribeOpen(false)}
                          >
                            ×
                          </button>
                          <form onSubmit={handleSubscribe} className="newsletter-subscribe-form">
                            <div className="form-row">
                              <label htmlFor="newsletter-email">Your email</label>
                              <input id="newsletter-email" name="email" type="email" required placeholder="you@example.edu" />
                            </div>
                            <button type="submit" disabled={submittingSub} className="btn-chronicle">Subscribe</button>
                            <p className="form-message">{subscribeMessage}</p>
                          </form>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="newsletter-story-block">
                <h2 className="newsletter-story-title">Submit a story</h2>
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
                  <button type="submit" disabled={submittingStory} className="btn-chronicle">Submit story</button>
                  <p className="form-message form-message--story">{storyMessage}</p>
                </form>
              </div>
            </div>

          </div>
          {isOpen && latest && (
            <div className="newsletter-modal" role="dialog" aria-modal="true" aria-label={latest.title}>
              <div className="newsletter-modal-backdrop" onClick={() => setIsOpen(false)} />
              <div className="newsletter-modal-content">
                <button
                  type="button"
                  className="newsletter-modal-close"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
                <article className="chronicle-edition chronicle-edition--full">
                  <div className="chronicle-edition-inner">
                    {latest.masthead && (
                      <div className="chronicle-masthead" aria-hidden>{latest.masthead}</div>
                    )}
                    <h3 className="chronicle-headline">{latest.title}</h3>
                    <p className="chronicle-date">{formatNewsletterDate(latest.date)}</p>
                    <div className="chronicle-sections">
                      {(latest.sections || []).map((sec, idx) => (
                        <section key={idx} className="chronicle-section">
                          {sec.heading && (
                            <h4 className="chronicle-section-head">{sec.heading}</h4>
                          )}
                          <div className="chronicle-section-body">
                            {sec.body.split(/\n/).map((para, i) => (
                              para.trim() ? <p key={i}>{para}</p> : null
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
