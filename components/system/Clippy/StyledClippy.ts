import { createGlobalStyle } from "styled-components";

const ClippyStyles = createGlobalStyle`
  .clippy {
    z-index: 10000 !important;
  }

  .clippy-balloon {
    border-radius: 8px !important;
    z-index: 10001 !important;
  }

  /* Hide the tip - it doesn't position correctly with dynamic content */
  .clippy-tip {
    display: none !important;
  }

  /* Fix balloon positioning - library has a bug swapping scrollX/scrollY */
  .clippy-balloon.clippy-top-right {
    transform: translate(50px, -20px);
  }

  .clippy-balloon.clippy-top-left {
    transform: translate(-50px, -20px);
  }

  .clippy-balloon.clippy-bottom-right {
    transform: translate(50px, 20px);
  }

  .clippy-balloon.clippy-bottom-left {
    transform: translate(-50px, 20px);
  }
`;

export default ClippyStyles;
