import { useEffect, useRef } from "react";
import { getRandomTip } from "components/system/Clippy/tips";

type ClippyAgent = {
  play: (animation: string, timeout?: number, callback?: () => void) => boolean;
  speak: (text: string, hold: boolean) => void;
};

const AMBIENT_ANIMATIONS = [
  "Idle1_1",
  "Wave",
  "Congratulate",
  "LookDown",
  "LookUp",
  "Thinking",
  "IdleAtom",
  "IdleEyeBrowRaise",
  "IdleFingerTap",
  "IdleHeadScratch",
  "IdleSideToSide",
  "IdleSnooze",
];

const ANIMATION_INTERVAL_MIN = 30000;
const ANIMATION_INTERVAL_MAX = 60000;
const TIP_INTERVAL_MIN = 120000;
const TIP_INTERVAL_MAX = 300000;

const getRandomInterval = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomAnimation = (): string =>
  AMBIENT_ANIMATIONS[Math.floor(Math.random() * AMBIENT_ANIMATIONS.length)];

const useAmbientMode = (
  clippy: ClippyAgent | undefined,
  enabled: boolean
): void => {
  const animationTimeoutRef = useRef<number>(0);
  const tipTimeoutRef = useRef<number>(0);

  useEffect(() => {
    if (!clippy || !enabled) {
      return () => {
        // Cleanup handled below
      };
    }

    const playRandomAnimation = (): void => {
      clippy.play(getRandomAnimation());
      animationTimeoutRef.current = window.setTimeout(
        playRandomAnimation,
        getRandomInterval(ANIMATION_INTERVAL_MIN, ANIMATION_INTERVAL_MAX)
      );
    };

    const showRandomTip = (): void => {
      clippy.speak(getRandomTip(), false);
      tipTimeoutRef.current = window.setTimeout(
        showRandomTip,
        getRandomInterval(TIP_INTERVAL_MIN, TIP_INTERVAL_MAX)
      );
    };

    animationTimeoutRef.current = window.setTimeout(
      playRandomAnimation,
      getRandomInterval(ANIMATION_INTERVAL_MIN, ANIMATION_INTERVAL_MAX)
    );
    tipTimeoutRef.current = window.setTimeout(
      showRandomTip,
      getRandomInterval(TIP_INTERVAL_MIN, TIP_INTERVAL_MAX)
    );

    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      if (tipTimeoutRef.current) {
        window.clearTimeout(tipTimeoutRef.current);
      }
    };
  }, [clippy, enabled]);
};

export default useAmbientMode;
