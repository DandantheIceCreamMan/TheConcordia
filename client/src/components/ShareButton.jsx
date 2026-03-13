import { useState } from 'react';
import { getEventShareUrl } from '../api';

export default function ShareButton({ eventId, className = 'btn btn-share', children }) {
  const [copied, setCopied] = useState(false);
  const label = children ?? 'Share';

  const handleClick = () => {
    const url = getEventShareUrl(eventId);
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        prompt('Copy this link:', url);
      }
    );
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {copied ? 'Copied!' : label}
    </button>
  );
}
