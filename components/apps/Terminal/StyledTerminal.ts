import styled from "styled-components";
import ScrollBars from "styles/common/ScrollBars";

const StyledTerminal = styled.div`
  height: 100%;
  width: 100%;

  .terminal {
    backdrop-filter: ${({ theme }) =>
      theme.name === "Breeze" ? "none" : "blur(8px)"};
    height: 100% !important;
  }

  .xterm-viewport {
    ${({ theme }) =>
      ScrollBars(17, 0, 0, theme.name === "Breeze" ? "light" : "dark")};
    width: 100% !important;
  }

  .xterm-screen {
    .xterm-rows {
      .xterm-cursor-underline {
        border-bottom-color: #f3f3f3 !important;
        border-bottom-width: 4px !important;
      }

      .xterm-cursor-block {
        background-color: ${({ theme }) =>
          theme.name === "Breeze" ? "#fcfcfc" : "#f3f3f3"} !important;
      }

      .xterm-cursor-blink {
        animation-duration: 1.067s !important;
      }
    }
  }
`;

export default StyledTerminal;
