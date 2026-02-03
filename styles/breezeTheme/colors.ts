const colors = {
  background: "#eff0f1",
  fileEntry: {
    background: "hsla(209, 50%, 70%, 25%)",
    backgroundFocused: "hsla(209, 70%, 70%, 35%)",
    backgroundFocusedHover: "hsla(209, 90%, 70%, 30%)",
    border: "hsla(209, 50%, 70%, 30%)",
    borderFocused: "hsla(209, 70%, 70%, 35%)",
    borderFocusedHover: "hsla(209, 90%, 70%, 40%)",
    text: "#FFF",
    textShadow: `
      0 0 1px rgba(0, 0, 0, 75%),
      0 0 2px rgba(0, 0, 0, 50%),

      0 1px 1px rgba(0, 0, 0, 75%),
      0 1px 2px rgba(0, 0, 0, 50%),

      0 2px 1px rgba(0, 0, 0, 75%),
      0 2px 2px rgba(0, 0, 0, 50%)`,
  },
  highlight: "#3daee9",
  progress: "#27ae60",
  progressBackground: "hsla(145, 45%, 45%, 70%)",
  progressBarRgb: "rgb(39, 174, 96)",
  selectionHighlight: "#3daee9",
  selectionHighlightBackground: "hsla(209, 82%, 58%, 30%)",
  taskbar: {
    active: "hsla(0, 0%, 20%, 70%)",
    activeForeground: "hsla(0, 0%, 40%, 70%)",
    ai: {
      balanced: ["rgb(112, 203, 255)", "rgb(40, 112, 234)", "rgb(0, 95, 184)"],
      creative: [
        "rgb(215, 167, 187)",
        "rgb(145, 72, 135)",
        "rgb(139, 37, 126)",
      ],
      precise: ["rgb(167, 224, 235)", "rgb(0, 104, 128)", "rgb(0, 83, 102)"],
    },
    background: "hsla(0, 0%, 10%, 70%)",
    button: {
      color: "#FFF",
    },
    foreground: "hsla(0, 0%, 35%, 70%)",
    foregroundHover: "hsla(0, 0%, 45%, 70%)",
    foregroundProgress: "hsla(104, 22%, 45%, 30%)",
    hover: "hsla(0, 0%, 25%, 70%)",
    peekBorder: "hsla(0, 0%, 50%, 50%)",
  },
  text: "rgba(255, 255, 255, 90%)",
  titleBar: {
    background: "#475057",
    backgroundHover: "#5a656c",
    backgroundInactive: "#eff0f1",
    buttonInactive: "#7f8c8d",
    closeHover: "#da4453",
    text: "#fcfcfc",
    textInactive: "#7f8c8d",
  },
  window: {
    background: "#eff0f1",
    outline: "#bdc3c7",
    outlineInactive: "#bdc3c7",
    shadow: "0 2px 12px 0 rgba(0, 0, 0, 20%)",
    shadowInactive: "0 2px 8px 0 rgba(0, 0, 0, 15%)",
  },
};

export default colors;
