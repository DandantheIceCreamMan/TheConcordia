import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="copyright">
          &copy; {year} UATX Concordia
          · <Link to="/">Home</Link> · <Link to="/join">Join &amp; Contact</Link>
        </p>
      </div>
    </footer>
  );
}
