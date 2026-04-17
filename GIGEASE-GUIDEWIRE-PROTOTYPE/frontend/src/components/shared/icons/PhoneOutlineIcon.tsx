import React from 'react';

type Props = { className?: string; size?: number };

/** Minimal phone frame: rounded rect + punch-hole dot (top-left). */
export const PhoneOutlineIcon: React.FC<Props> = ({ className = '', size = 22 }) => (
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
      x="5"
      y="2.5"
      width="14"
      height="19"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.25" cy="6.25" r="1.35" fill="currentColor" />
  </svg>
);
