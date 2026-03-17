import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="copyright">
          &copy; {year} The Concordian
          · <Link to="/">Home</Link> · <Link to="/join">Join &amp; Contact</Link>
          · <Link to="/admin">Admin</Link>
        </p>
      </div>
    </footer>
  );
}
