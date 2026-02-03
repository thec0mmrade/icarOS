import { memo } from "react";

export const BreezeMinimizeIcon = memo(() => (
  <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 5h8" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
));

export const BreezeMaximizeIcon = memo(() => (
  <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
    <rect
      fill="none"
      height="8"
      rx="0.5"
      stroke="currentColor"
      strokeWidth="1.2"
      width="8"
      x="1"
      y="1"
    />
  </svg>
));

export const BreezeMaximizedIcon = memo(() => (
  <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
    <rect
      fill="none"
      height="7"
      rx="0.5"
      stroke="currentColor"
      strokeWidth="1.2"
      width="7"
      x="2.5"
      y="0.5"
    />
    <rect
      fill="none"
      height="7"
      rx="0.5"
      stroke="currentColor"
      strokeWidth="1.2"
      width="7"
      x="0.5"
      y="2.5"
    />
  </svg>
));

export const BreezeCloseIcon = memo(() => (
  <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.5 1.5l7 7M8.5 1.5l-7 7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.2"
    />
  </svg>
));
