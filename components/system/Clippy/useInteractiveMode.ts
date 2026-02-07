import { useEffect, useRef } from "react";
import { useProcesses } from "contexts/process";
import { getAppMessage } from "components/system/Clippy/tips";

type ClippyAgent = {
  play: (animation: string, timeout?: number, callback?: () => void) => boolean;
  speak: (text: string, hold: boolean) => void;
};

const ERROR_MESSAGES = [
  "Oops! Something went wrong. Don't worry, it happens!",
  "An error occurred. Let me look into that...",
  "Hmm, that didn't work as expected. Try again?",
];

const getRandomErrorMessage = (): string =>
  ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

const useInteractiveMode = (
  clippy: ClippyAgent | undefined,
  enabled: boolean
): void => {
  const { processes } = useProcesses();
  const previousProcessIds = useRef<Set<string>>(new Set());
  const lastSpokenAppRef = useRef<string>("");

  useEffect(() => {
    if (!clippy || !enabled) return;

    const currentProcessIds = new Set(Object.keys(processes));

    for (const id of currentProcessIds) {
      if (
        !previousProcessIds.current.has(id) &&
        id !== lastSpokenAppRef.current
      ) {
        const message = getAppMessage(id);

        if (message) {
          clippy.speak(message, false);
          clippy.play("Wave");
          lastSpokenAppRef.current = id;
        }
        break;
      }
    }

    previousProcessIds.current = currentProcessIds;
  }, [clippy, enabled, processes]);

  useEffect(() => {
    if (!clippy || !enabled) {
      return () => {
        // Cleanup handled below
      };
    }

    const handleError = (): void => {
      clippy.speak(getRandomErrorMessage(), false);
      clippy.play("Sad");
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, [clippy, enabled]);
};

export default useInteractiveMode;
