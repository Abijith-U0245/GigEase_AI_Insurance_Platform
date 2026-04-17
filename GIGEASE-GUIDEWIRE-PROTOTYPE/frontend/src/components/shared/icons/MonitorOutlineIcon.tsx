import React from 'react';

type Props = { className?: string; size?: number };

/** Simple desktop monitor outline — pair with PhoneOutlineIcon for view toggle. */
export const MonitorOutlineIcon: React.FC<Props> = ({ className = '', size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="12"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);
