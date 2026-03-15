import { useEffect, useState } from 'react';
import { fetchJSON, postJSON } from '../api';

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
  const [email, setEmail] = useState(() => {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(VOTER_EMAIL_KEY) || '';
  });
  const [voteMessage, setVoteMessage] = useState({ pollId: null, type: '', text: '' });
  const [votingPollId, setVotingPollId] = useState(null);

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
      setVoteMessage({ pollId, type: 'error', text: 'Enter your email above to cast your vote. One vote per person per poll.' });
      return;
    }
    setVoteMessage({ pollId, type: 'sending', text: 'Recording your vote…' });
    setVotingPollId(pollId);
    const url = `${window.location.origin}/api/polls/${Number(pollId)}/vote`;
    const body = { optionId: Number(optionId), email: trimmedEmail };
    try {
      const { response: res, data } = await postJSON(url, body);
      if (!res.ok) {
        if (data && data.votedOptionId != null) {
          const poll = polls.find((p) => p.id === pollId);
          const opt = poll?.options.find((o) => Number(o.id) === Number(data.votedOptionId));
          setVoteMessage({
            pollId,
            type: 'already',
            text: opt ? `You already voted for ${opt.label}.` : 'You have already voted in this poll.'
          });
        } else {
          setVoteMessage({ pollId, type: 'error', text: (data && data.error) || 'Could not record vote.' });
        }
        return;
      }
      if (data && (data.votedOptionId != null || !data.error)) {
        setVoteMessage({ pollId, type: 'success', text: `Vote recorded: ${optionLabel}.` });
        if (typeof localStorage !== 'undefined') localStorage.setItem(VOTER_EMAIL_KEY, trimmedEmail);
        loadPolls(trimmedEmail);
      } else {
        setVoteMessage({ pollId, type: 'error', text: (data && data.error) || 'Vote did not register. Try again.' });
      }
    } catch (err) {
      setVoteMessage({ pollId, type: 'error', text: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      setVotingPollId(null);
    }
  };

  return (
    <div className="page-main polls-page">
      <section className="section polls-section">
        <div className="container">
          <header className="polls-header">
            <h1 className="polls-title">House polls</h1>
            <p className="polls-intro">
              Official club votes. Choose one option per poll—your email identifies your vote so we count one per person.
            </p>
          </header>

          <div className="polls-email-block" aria-label="Voter identification">
            <label htmlFor="poll-email" className="polls-email-label">Your email</label>
            <input
              id="poll-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.edu"
              className="polls-email-input"
              autoComplete="email"
            />
            <span className="polls-email-note">One vote per person per poll.</span>
          </div>

          {loading && (
            <div className="polls-loading" aria-live="polite">
              <span className="polls-loading-dot" />
              <span className="polls-loading-dot" />
              <span className="polls-loading-dot" />
              <p>Loading polls…</p>
            </div>
          )}
          {error && (
            <div className="polls-error" role="alert">
              <p>Could not load polls. Please refresh the page.</p>
            </div>
          )}
          {!loading && !error && polls.length === 0 && (
            <div className="polls-empty">
              <p>No active polls at the moment. Check back soon.</p>
            </div>
          )}

          <div className="polls-list">
            {!loading && !error && polls.map((poll) => {
              const votedOptionId = poll.votedOptionId;
              const messageForThis = voteMessage.pollId === poll.id ? voteMessage : null;
              const closesAtFormatted = formatClosingDate(poll.closesAt);
              const isClosed = poll.closesAt && new Date(poll.closesAt) < new Date();

              return (
                <article
                  key={poll.id}
                  className={`poll-ballot ${votedOptionId != null ? 'poll-ballot--voted' : ''} ${isClosed ? 'poll-ballot--closed' : ''}`}
                  aria-labelledby={`poll-question-${poll.id}`}
                >
                  <div className="poll-ballot-inner">
                    <h2 id={`poll-question-${poll.id}`} className="poll-question">
                      {poll.question}
                    </h2>
                    {poll.description && (
                      <p className="poll-desc">{poll.description}</p>
                    )}
                    {closesAtFormatted && (
                      <p className="poll-deadline">
                        {isClosed ? 'Voting closed.' : `Closes ${closesAtFormatted}.`}
                      </p>
                    )}

                    <div className="poll-choices" role="group" aria-label={`Choices for: ${poll.question}`}>
                      {poll.options.map((opt) => {
                        const isVoted = votedOptionId === opt.id;
                        const isVoting = votingPollId === poll.id;
                        const disabled = votedOptionId != null || isClosed || isVoting;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={`poll-choice ${isVoted ? 'poll-choice--selected' : ''}`}
                            onClick={() => handleVote(poll.id, opt.id, opt.label)}
                            disabled={disabled}
                            aria-pressed={isVoted}
                            aria-busy={isVoting}
                            title={disabled ? (votedOptionId != null ? 'Already voted' : isClosed ? 'Poll closed' : 'Voting…') : `Vote for ${opt.label}`}
                          >
                            <span className="poll-choice-marker" aria-hidden>
                              {isVoted ? '✓' : '○'}
                            </span>
                            <span className="poll-choice-label">{isVoting ? 'Recording…' : opt.label}</span>
                            {isVoted && !isVoting && <span className="poll-choice-badge">Your vote</span>}
                          </button>
                        );
                      })}
                    </div>

                    {votedOptionId != null && (
                      <p className="poll-your-vote" aria-live="polite">
                        You voted for <strong>{poll.options.find((o) => o.id === votedOptionId)?.label}</strong>.
                      </p>
                    )}

                    <div className="poll-feedback" role="status" aria-live="polite">
                      {messageForThis && messageForThis.type === 'sending' && (
                        <p className="poll-msg poll-msg--sending">{messageForThis.text}</p>
                      )}
                      {messageForThis && messageForThis.type === 'error' && (
                        <p className="poll-msg poll-msg--error">{messageForThis.text}</p>
                      )}
                      {messageForThis && messageForThis.type === 'already' && (
                        <p className="poll-msg poll-msg--already">{messageForThis.text}</p>
                      )}
                      {messageForThis && messageForThis.type === 'success' && (
                        <p className="poll-msg poll-msg--success">{messageForThis.text}</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
