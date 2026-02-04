import styled from "styled-components";
import Message from "styles/common/Message";
import ScrollBars from "styles/common/ScrollBars";
import { DEFAULT_SCROLLBAR_WIDTH } from "utils/constants";

const StyledMarked = styled.div`
  article {
    ${ScrollBars(DEFAULT_SCROLLBAR_WIDTH, 0, 0, "light")};
    background-color: #f9f9f9;
    box-sizing: border-box;
    font-size: 16px;
    height: 100%;
    line-height: 1.5;
    overflow-wrap: break-word;
    overflow-y: auto;
    padding: 16px 32px;
    width: 100%;

    * {
      all: revert;
      user-select: text;
    }

    a {
      color: #0366d6;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    header {
      display: flex;
    }

    h1,
    h2 {
      border-bottom: 1px solid #ccc;
      margin: 10px 0;
    }

    h1 {
      font-size: 2em;
      padding: 9px 0;

      header & {
        margin: 0;
      }

      &:first-of-type {
        margin-top: 0;
      }
    }

    h2 {
      font-size: 1.5em;
      padding: 7px 0;
    }

    h3 {
      font-size: 1em;
      padding: 5px 0;
    }

    ul {
      line-height: 1.6;
      padding-inline-start: 30px;
    }

    nav {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 3px;
      margin-right: 10px;

      > ul {
        font-size: 14px;
        list-style-type: none;
        margin: 10px 0;
        padding: 0;
        position: sticky;
        top: 5px;

        > li {
          min-width: 125px;
          padding: 0 15px;

          > ul {
            padding-left: 25px;

            > li {
              font-size: 0.8em;
            }
          }
        }
      }

      .selected {
        color: #111;
        font-weight: 700;

        &:hover {
          text-decoration: none;
        }
      }
    }

    table {
      border: 1px solid #ddd;
      border-collapse: collapse;
      border-spacing: 0;

      td,
      th {
        border: 1px solid #ddd;
        padding: 5px;
      }
    }

    pre {
      background-color: #f6f8fa;
      border-radius: 3px;
      font-family:
        SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 85%;
      line-height: 1.45;
      overflow: auto;
      padding: 16px;
    }

    code:not([class]) {
      background-color: rgb(27 31 35 / 5%);
      border-radius: 3px;
      font-size: 85%;
      margin: 0;
      padding: 0.2em 0.4em;
    }

    &.drop {
      ${Message("Drop markdown file here", "#000")};
    }

    @media (prefers-color-scheme: dark) {
      background-color: #0d1117;
      color: #e6edf3;

      a {
        color: #58a6ff;
      }

      h1,
      h2 {
        border-bottom-color: #30363d;
      }

      nav {
        background: #161b22;
        border-color: #30363d;

        .selected {
          color: #f0f6fc;
        }
      }

      table {
        border-color: #30363d;

        td,
        th {
          border-color: #30363d;
        }
      }

      pre {
        background-color: #161b22;
      }

      code:not([class]) {
        background-color: rgb(110 118 129 / 40%);
      }

      &.drop {
        ${Message("Drop markdown file here", "#e6edf3")};
      }

      scrollbar-color: rgb(77 77 77) rgb(23 23 23);

      &::-webkit-scrollbar-corner,
      &::-webkit-scrollbar-track {
        background-color: rgb(23 23 23);
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgb(77 77 77);
      }

      &::-webkit-scrollbar-thumb:hover {
        background-color: rgb(122 122 122);
      }

      &::-webkit-scrollbar-thumb:active {
        background-color: rgb(166 166 166);
      }

      &::-webkit-scrollbar-button:single-button {
        background-color: rgb(23 23 23);
        border-color: rgb(23 23 23);

        &:hover {
          background-color: rgb(55 55 55);
        }

        &:active {
          background-color: rgb(166 166 166);
        }
      }
    }
  }
`;

export default StyledMarked;
