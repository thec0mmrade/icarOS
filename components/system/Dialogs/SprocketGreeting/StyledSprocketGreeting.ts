import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(233, 69, 96, 0.5);
    opacity: 1;
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 20px rgba(233, 69, 96, 0.9), 0 0 40px rgba(233, 69, 96, 0.4);
    opacity: 1;
    transform: scale(1.02);
  }
`;

const StyledSprocketGreeting = styled.div`
  background-color: #1a1a2e;
  color: #eee;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.formats.systemFont};
  font-size: 13px;
  height: 100%;
  padding: 20px 24px;

  h1 {
    color: #e94560;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
  }

  p {
    line-height: 1.5;
    margin: 0 0 12px;
    white-space: pre-wrap;

    &.cta {
      color: #4ade80;
      font-weight: 600;
      margin-top: 4px;
      text-align: center;
    }
  }

  .terminal {
    background-color: #0d0d1a;
    border: 1px solid #2a2a4a;
    border-radius: 4px;
    flex: 1;
    margin-bottom: 12px;
    min-height: 0;
    overflow: auto;
    padding: 10px 12px;

    .command {
      color: #4ade80;
      display: block;
      font-family: monospace;
      font-size: 11px;
      margin-bottom: 8px;
    }

    pre {
      color: #888;
      font-family: monospace;
      font-size: 10px;
      line-height: 1.4;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;

      .highlight {
        animation: ${pulse} 1.5s ease-in-out infinite;
        background-color: rgb(233 69 96 / 30%);
        border-radius: 3px;
        color: #ff4d6d;
        display: inline-block;
        font-weight: 600;
        padding: 2px 6px;
      }
    }
  }

  nav {
    display: flex;
    flex-direction: row;
    gap: 12px;
    justify-content: flex-end;
    margin-top: auto;
    padding-top: 16px;
  }

  button {
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: ${({ theme }) => theme.formats.systemFont};
    font-size: 13px;
    height: 32px;
    min-width: 100px;
    padding: 0 16px;
    transition: background-color 0.2s ease;

    &.primary {
      animation: ${pulse} 1.5s ease-in-out infinite;
      background-color: #e94560;
      color: #fff;

      &:hover {
        animation: none;
        background-color: #d63d56;
        box-shadow: 0 0 15px rgb(233 69 96 / 70%);
        transform: scale(1.02);
      }

      &:active {
        animation: none;
        background-color: #c4354c;
        transform: scale(0.98);
      }
    }

    &.secondary {
      background-color: #16213e;
      color: #aaa;

      &:hover {
        background-color: #1f2f52;
        color: #ccc;
      }

      &:active {
        background-color: #0f1729;
      }
    }
  }
`;

export default StyledSprocketGreeting;
