import { useEffect, useState } from 'react';
import { fetchJSON } from '../api';

const VOTER_EMAIL_KEY = 'concordia_poll_voter_email';

function formatClosingDate(closesAt) {
  if (!closesAt) return null;
  try {
    const d = new Date(closesAt);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState(() => localStorage.getItem(VOTER_EMAIL_KEY) || '');
  const [voteMessage, setVoteMessage] = useState({ pollId: null, type: '', text: '' });

  const loadPolls = (emailForStatus = null) => {
    const useEmail = emailForStatus != null ? emailForStatus : email.trim();
    const url = useEmail
      ? `/api/polls?email=${encodeURIComponent(useEmail)}`
      : '/api/polls';
    fetchJSON(url)
      .then(setPolls)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const handleVote = async (pollId, optionId, optionLabel) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setVoteMessage({ pollId, type: 'error', text: 'Enter your email above to vote. One vote per person per poll.' });
      return;
    }
    setVoteMessage({ pollId: null, type: '', text: '' });
    try {
      const res = await fetch('/api/polls/' + pollId + '/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, email: trimmedEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.votedOptionId != null) {
          const poll = polls.find((p) => p.id === pollId);
          const opt = poll?.options.find((o) => o.id === data.votedOptionId);
          setVoteMessage({
            pollId,
            type: 'already',
            text: opt ? `You already voted for ${opt.label}.` : 'You have already voted in this poll.'
          });
        } else {
          setVoteMessage({ pollId, type: 'error', text: data.error || 'Could not submit vote.' });
        }
        return;
      }
      if (data.votedOptionId != null) {
        setVoteMessage({ pollId, type: 'success', text: `You voted for ${optionLabel}.` });
        if (localStorage) localStorage.setItem(VOTER_EMAIL_KEY, trimmedEmail);
        loadPolls(trimmedEmail);
      }
    } catch {
      setVoteMessage({ pollId, type: 'error', text: 'Could not submit vote. Try again.' });
    }
  };

  return (
    <div className="page-main">
      <section className="section">
        <div className="container">
          <h2>House polls</h2>
          <p className="section-intro">
            When the common room can&apos;t decide between a debate, a movie, or a billiards night,
            we put it to a vote. One vote per person per poll—we use your email so we only count you once.
          </p>

          <div className="poll-email-row">
            <label htmlFor="poll-email">Your email</label>
            <input
              id="poll-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.edu"
              className="poll-email-input"
            />
            <p className="poll-email-hint">Required to vote. One vote per person per poll.</p>
          </div>

          {loading && <p>Loading…</p>}
          {error && <p className="poll-error">Failed to load polls.</p>}
          {!loading && !error && polls.length === 0 && (
            <p className="poll-empty">No active polls right now. Check back soon—or suggest one at a meeting.</p>
          )}

          {!loading && !error && polls.map((poll) => {
            const votedOptionId = poll.votedOptionId;
            const messageForThis = voteMessage.pollId === poll.id ? voteMessage : null;
            const closesAtFormatted = formatClosingDate(poll.closesAt);
            const isClosed = poll.closesAt && new Date(poll.closesAt) < new Date();

            return (
              <div key={poll.id} className="poll poll-card">
                <h3>{poll.question}</h3>
                {poll.description && (
                  <p className="poll-description">{poll.description}</p>
                )}
                {closesAtFormatted && (
                  <p className="poll-closes">
                    {isClosed ? 'Voting has closed.' : `Voting closes on ${closesAtFormatted}.`}
                  </p>
                )}
                <div className="poll-options">
                  {poll.options.map((opt) => {
                    const isVoted = votedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`poll-option-btn ${isVoted ? 'poll-option-btn--voted' : ''}`}
                        onClick={() => handleVote(poll.id, opt.id, opt.label)}
                        disabled={votedOptionId != null || isClosed}
                        title={votedOptionId != null ? 'You have already voted in this poll' : isClosed ? 'This poll has closed' : `Vote for ${opt.label}`}
                      >
                        <span className="poll-option-label">{opt.label}</span>
                        {isVoted && <span className="poll-option-selected">Selected</span>}
                      </button>
                    );
                  })}
                </div>
                {votedOptionId != null && (
                  <p className="poll-voted-msg">
                    You voted for <strong>{poll.options.find((o) => o.id === votedOptionId)?.label}</strong>.
                  </p>
                )}
                {messageForThis && messageForThis.type === 'error' && (
                  <p className="poll-message poll-message--error">{messageForThis.text}</p>
                )}
                {messageForThis && messageForThis.type === 'already' && (
                  <p className="poll-message poll-message--already">{messageForThis.text}</p>
                )}
                {messageForThis && messageForThis.type === 'success' && (
                  <p className="poll-message poll-message--success">{messageForThis.text}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
