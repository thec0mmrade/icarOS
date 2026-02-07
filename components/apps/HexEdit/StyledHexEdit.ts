import styled from "styled-components";

type StyledHexEditProps = {
  $loaded: boolean;
};

const StyledHexEdit = styled.div<StyledHexEditProps>`
  height: 100%;
  width: 100%;

  iframe {
    border: 0;
    height: 100%;
    opacity: ${({ $loaded }) => ($loaded ? "100%" : "0%")};
    transition: opacity 0.25s ease-in;
    width: 100%;
  }

  .loading {
    &::before {
      color: #fff;
      font-weight: 500;
      mix-blend-mode: normal;
      text-shadow: 1px 2px 3px rgb(0 0 0 / 50%);
    }
  }
`;

export default StyledHexEdit;
