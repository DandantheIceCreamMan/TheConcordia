import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <h1 className="site-title">
            <Link to="/">UATX Concordia</Link>
          </h1>
          <p className="tagline">The Common Room for conversations, curiosities, and late-night schemes.</p>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
          <div className="nav-dropdown">
            <Link to="/events" className="nav-dropdown-trigger">Upcoming Events ▾</Link>
            <ul className="nav-dropdown-menu">
              <li><Link to="/calendar">Calendar</Link></li>
              <li><Link to="/events">Upcoming events</Link></li>
              <li><Link to="/past-events">Past events</Link></li>
            </ul>
          </div>
          <NavLink to="/propose" className={({ isActive }) => isActive ? 'active' : ''}>Propose an Event</NavLink>
          <NavLink to="/polls" className={({ isActive }) => isActive ? 'active' : ''}>Polls</NavLink>
          <NavLink to="/newsletter" className={({ isActive }) => isActive ? 'active' : ''}>Newsletter</NavLink>
        </nav>
        <div className="header-actions">
          <Link to="/join" className="join-chip">Join &amp; Contact</Link>
        </div>
      </div>
    </header>
  );
}
