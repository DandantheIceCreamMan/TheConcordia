import { useEffect, useState } from 'react';
import { fetchJSON } from '../api';

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPolls = () => {
    fetchJSON('/api/polls')
      .then(setPolls)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const handleVote = async (pollId, optionId) => {
    try {
      await fetchJSON(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId }),
      });
      await loadPolls();
    } catch (err) {
      console.error('Failed to submit vote', err);
    }
  };

  return (
    <div className="page-main">
      <section className="section">
        <div className="container">
          <h2>House polls</h2>
          <p className="section-intro">
            When the common room can't decide between a debate, a movie, or a billiards night,
            we put it to a vote. Choose your side; we actually listen.
          </p>
          {loading && <p>Loading…</p>}
          {error && <p>Failed to load polls.</p>}
          {!loading && !error && polls.length === 0 && <p>No active polls right now.</p>}
          {!loading && !error && polls.map((poll) => (
            <div key={poll.id} className="poll">
              <h3>{poll.question}</h3>
              <div className="poll-options">
                {poll.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleVote(poll.id, opt.id)}
                  >
                    {opt.label} ({opt.votes})
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
