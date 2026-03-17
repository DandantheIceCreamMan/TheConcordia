import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJSON, getEventShareUrl, isPastEvent } from '../api';
import ShareButton from '../components/ShareButton';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchJSON('/api/events')
      .then((events) => {
        if (cancelled) return;
        const upcoming = events.filter((e) => !isPastEvent(e));
        const source = upcoming.length ? upcoming : events;
        setFeatured(source.slice(0, 2));
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const bannerImages = [
    {
      url: 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?auto=format&fit=crop&w=1600&q=80',
      alt: 'Candlelit dinner table with friends gathered'
    },
    {
      url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80',
      alt: 'Warm common room with people talking and reading'
    },
    {
      url: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1600&q=80',
      alt: 'Students walking through a museum gallery'
    },
    {
      url: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1600&q=80',
      alt: 'Group of friends on an evening walk in the city'
    }
  ];

  return (
    <>
      <section className="hero hero--with-bg" id="description">
        <div className="hero-overlay" />
        <div className="hero-ornament hero-ornament--top" aria-hidden="true" />
        <div className="hero-ornament hero-ornament--bottom" aria-hidden="true" />
        <div className="container hero-content">
          <h2 className="hero-title">The Common Room</h2>
          <p>
            Concordia is a social society for a small college: a group of students who like the
            evenings as much as the daytime. We host things that make it easy to show up—whether
            you bring three friends or come by yourself and leave knowing more people than when you
            arrived.
          </p>
          <p>
            Some nights look like long tables and shared suppers, others like small groups heading
            out to a museum or game night, or settling in for films and pool in the common room.
            The club exists so that, after classes, there is always a door open and some plan on
            the board for people who want to be around other people.
          </p>
        </div>
      </section>

      <section className="section section--at-a-glance" aria-labelledby="at-a-glance-heading">
        <div className="container">
          <h2 id="at-a-glance-heading">At a glance</h2>
          <p className="section-intro">
            One place to find the evenings at Concordia—whether you are looking for supper,
            something quiet after class, or an excuse to leave the library.
          </p>
          <div className="at-a-glance-grid">
            <Link className="at-a-glance-item" to="/events">
              <h3>Browse evenings</h3>
              <p>See the current notice board of suppers, parties, walks, and outings.</p>
            </Link>
            <Link className="at-a-glance-item" to="/calendar">
              <h3>Check the calendar</h3>
              <p>Look ahead by week or month so you can plan around essays and rehearsals.</p>
            </Link>
            <Link className="at-a-glance-item" to="/propose">
              <h3>Propose an idea</h3>
              <p>Pitch the evening you wish existed—dinners, debates, film nights, or something odd.</p>
            </Link>
            <Link className="at-a-glance-item" to="/polls">
              <h3>Shape what happens</h3>
              <p>Vote in polls and read the Chronicle so the common room reflects the people in it.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--featured" aria-labelledby="featured-heading">
        <div className="container">
          <h2 id="featured-heading">What's happening this week</h2>
          <p className="section-intro">
            A couple of evenings pulled from the board—easy places to start if you are new to the club.
          </p>
          <div className="featured-events" aria-live="polite">
            {loading && <p className="featured-empty">Loading…</p>}
            {error && (
              <p className="featured-empty">We couldn't load this week's evenings. Try refreshing the page.</p>
            )}
            {!loading && !error && featured.length === 0 && (
              <p className="featured-empty">No evenings on the board yet. Check back soon—or propose one.</p>
            )}
            {!loading && !error && featured.length > 0 && featured.map((event, index) => {
              const timeText = event.time ? ` · ${event.time}` : '';
              const img = bannerImages[index % bannerImages.length];
              const sideClass = index % 2 === 0 ? 'featured-banner--left' : 'featured-banner--right';
              return (
                <Link
                  key={event.id}
                  to="/events"
                  className={`featured-banner ${sideClass}`}
                  aria-label={`View upcoming evenings starting with ${event.title}`}
                >
                  <div
                    className="featured-banner-inner"
                    style={{ backgroundImage: `url(${img.url})` }}
                  >
                    <div className="featured-banner-overlay" />
                    <div className="featured-banner-content">
                      <h3 className="featured-banner-title">{event.title}</h3>
                      <p className="featured-banner-meta">
                        <span>{event.date}{timeText}</span>
                        <span> · {event.location}</span>
                      </p>
                      <p className="featured-banner-body">{event.description}</p>
                      <span className="featured-banner-cta">View all upcoming evenings →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="event-types" id="event-types" aria-labelledby="event-types-heading">
        <h2 id="event-types-heading" className="event-types-title">
          <span className="ornament-line" />
          <span className="event-types-title-text">Evenings in the Common Room</span>
          <span className="ornament-line" />
        </h2>
        <div className="container event-features">
          <article className="event-feature event-feature--dinners">
            <div className="event-feature-image" aria-hidden="true" />
            <div className="event-feature-body">
              <h3 className="event-feature-title">Supper Circuits</h3>
              <p className="event-feature-text">
                Candlelit progressive dinners that wander from kitchen to kitchen and table to table.
                Think Austen‑style conversation, modern snacks, and the occasional card trick.
              </p>
              <Link to="/events" className="event-feature-link">See upcoming suppers</Link>
            </div>
          </article>
          <article className="event-feature event-feature--parties">
            <div className="event-feature-image" aria-hidden="true" />
            <div className="event-feature-body">
              <h3 className="event-feature-title">Common Room Parties</h3>
              <p className="event-feature-text">
                Nights where the lamps are low, the playlist runs from jazz to film scores,
                and there is always a game of pool, cards, or Werewolf in progress.
              </p>
              <Link to="/events" className="event-feature-link">Browse house parties</Link>
            </div>
          </article>
          <article className="event-feature event-feature--museum">
            <div className="event-feature-image" aria-hidden="true" />
            <div className="event-feature-body">
              <h3 className="event-feature-title">Museum Walks</h3>
              <p className="event-feature-text">
                Small expeditions to galleries, museums, and curious corners of the city—followed
                by debriefs back in the common room over tea or something stronger.
              </p>
              <Link to="/events" className="event-feature-link">Join the next walk</Link>
            </div>
          </article>
          <article className="event-feature event-feature--outings">
            <div className="event-feature-image" aria-hidden="true" />
            <div className="event-feature-body">
              <h3 className="event-feature-title">Outings & Escapes</h3>
              <p className="event-feature-text">
                Picnics on the lawn, winter movie marathons, midnight hot‑chocolate runs,
                and other excuses to leave the library together.
              </p>
              <Link to="/events" className="event-feature-link">See all outings</Link>
            </div>
          </article>
        </div>
      </section>

      <section className="mission mission--ornament" id="mission">
        <div className="mission-divider" aria-hidden="true" />
        <div className="container">
          <h2 className="mission-title">
            <span className="ornament-line ornament-line--short" />
            Our Mission
            <span className="ornament-line ornament-line--short" />
          </h2>
          <p>
            Concordia exists to make a small campus feel like a well‑loved common room: familiar,
            thoughtful, a little chaotic, and never short of company. We believe that belonging is
            built in the in‑between hours—after tutorials, between rehearsals, before essays are due.
          </p>
          <p>
            We host evenings where you can argue about books and ideas, learn a new game,
            or simply sit in a corner armchair and listen. Whether you arrive in house scarf,
            linen blazer, or pyjamas under a coat, there is always a place at the table.
          </p>
          <p>
            This website is the notice board for that room: browse upcoming evenings, propose
            eccentric ideas, weigh in on polls, and subscribe to the newsletter so you never miss
            the next gathering that might become a favourite memory.
          </p>
        </div>
      </section>
    </>
  );
}
