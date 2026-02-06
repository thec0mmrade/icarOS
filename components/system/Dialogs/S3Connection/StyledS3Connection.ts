import styled from "styled-components";

const StyledS3Connection = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;

  h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px;
  }

  .connections-list {
    background-color: #fff;
    border: 1px solid rgb(217 217 217);
    flex: 1;
    margin-bottom: 12px;
    max-height: 120px;
    min-height: 60px;
    overflow-y: auto;

    .connection-item {
      align-items: center;
      border-bottom: 1px solid rgb(230 230 230);
      cursor: pointer;
      display: flex;
      gap: 8px;
      padding: 8px 12px;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: rgb(229 241 251);
      }

      &.selected {
        background-color: rgb(204 228 247);
      }

      .connection-info {
        flex: 1;

        .connection-name {
          font-size: 12px;
          font-weight: 500;
        }

        .connection-details {
          color: #666;
          font-size: 10px;
        }
      }

      .disconnect-btn {
        background: none;
        border: none;
        color: #d00;
        cursor: pointer;
        font-size: 11px;
        padding: 2px 6px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .empty-message {
      color: #666;
      font-size: 11px;
      padding: 12px;
      text-align: center;
    }
  }

  .form-section {
    background-color: #fff;
    border: 1px solid rgb(217 217 217);
    flex: 1;
    overflow-y: auto;
    padding: 12px;

    .form-row {
      align-items: center;
      display: flex;
      gap: 8px;
      margin-bottom: 10px;

      label {
        flex-shrink: 0;
        font-size: 11px;
        text-align: right;
        width: 90px;
      }

      input,
      select {
        border: 1px solid rgb(122 122 122);
        flex: 1;
        font-size: 11px;
        height: 23px;
        padding: 3px 6px;
      }

      input[type="password"] {
        font-family: monospace;
      }
    }
  }

  .buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;

    button {
      background-color: rgb(225 225 225);
      border: 1px solid rgb(173 173 173);
      cursor: pointer;
      font-size: 12px;
      height: 23px;
      min-width: 73px;
      padding: 0 12px;

      &:hover {
        background-color: rgb(229 241 251);
        border-color: rgb(0 120 215);
      }

      &:active {
        background-color: rgb(204 228 247);
      }

      &:disabled {
        background-color: rgb(204 204 204);
        border-color: rgb(191 191 191);
        color: #808080;
        cursor: not-allowed;
      }

      &.primary {
        background-color: rgb(0 120 215);
        border-color: rgb(0 84 153);
        color: #fff;

        &:hover {
          background-color: rgb(0 102 204);
        }

        &:active {
          background-color: rgb(0 84 153);
        }

        &:disabled {
          background-color: rgb(153 153 153);
          border-color: rgb(128 128 128);
        }
      }
    }
  }

  .status-message {
    font-size: 11px;
    margin-top: 8px;
    text-align: center;

    &.error {
      color: #d00;
    }

    &.success {
      color: #080;
    }
  }
`;

export default StyledS3Connection;
