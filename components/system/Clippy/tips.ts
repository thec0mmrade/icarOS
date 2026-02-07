export const GENERAL_TIPS = [
  "Did you know you can right-click the desktop to change wallpaper?",
  "Try double-clicking an icon to open it!",
  "You can drag windows by their title bar.",
  "Press F11 to enter full screen mode.",
  "Right-click the taskbar for more options!",
  "You can resize windows by dragging their edges.",
  "Double-click a window's title bar to maximize it.",
  "Drag files to the desktop to organize them.",
  "Try the Start menu for a list of applications!",
  "You can minimize windows by clicking their taskbar button.",
];

export const APP_MESSAGES: Record<string, string[]> = {
  Browser: [
    "Browsing the web? I can help you find things!",
    "Pro tip: Use bookmarks to save your favorite sites.",
  ],
  FileExplorer: [
    "Exploring files? You can create folders to organize them!",
    "Try right-clicking for more file options.",
  ],
  MonacoEditor: [
    "Writing code? Press Ctrl+S to save your work!",
    "Use Ctrl+F to search within your code.",
  ],
  Paint: [
    "Feeling creative? Try different brush sizes!",
    "Don't forget to save your masterpiece!",
  ],
  Photos: [
    "Nice photo! You can zoom in with the scroll wheel.",
    "Press the arrow keys to view next/previous photos.",
  ],
  Terminal: [
    "Power user! Try typing 'help' for available commands.",
    "Use the up arrow to access command history.",
  ],
  VideoPlayer: [
    "Enjoying the show? Press Space to pause/play.",
    "Use arrow keys to skip forward or backward.",
  ],
  Webamp: [
    "Rocking out! Try double-clicking the equalizer.",
    "You can drag and drop music files to add them.",
  ],
};

export const getRandomTip = (): string =>
  GENERAL_TIPS[Math.floor(Math.random() * GENERAL_TIPS.length)];

export const getAppMessage = (appId: string): string | undefined => {
  const appName = appId.split("__")[0];
  const messages = APP_MESSAGES[appName];

  if (!messages) return undefined;

  return messages[Math.floor(Math.random() * messages.length)];
};
