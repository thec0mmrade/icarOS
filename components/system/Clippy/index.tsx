import { memo, useCallback, useEffect, useRef, useState, type FC } from "react";
import { AGENTS } from "@react95/clippy";
import { useSession } from "contexts/session";
import useAmbientMode from "components/system/Clippy/useAmbientMode";
import useInteractiveMode from "components/system/Clippy/useInteractiveMode";
import ClippyStyles from "components/system/Clippy/StyledClippy";

type ClippyAgentType = {
  hide: (fast: boolean, callback: () => void) => void;
  play: (animation: string, timeout?: number, callback?: () => void) => boolean;
  show: (fast: boolean) => boolean | undefined;
  speak: (text: string, hold: boolean) => void;
};

const cleanupClippyDOM = (): void => {
  document.querySelectorAll(".clippy").forEach((el) => el.remove());
  document.querySelectorAll(".clippy-balloon").forEach((el) => el.remove());
};

const ClippyWrapper: FC = () => {
  const { clippyEnabled, clippyMode } = useSession();
  const [agent, setAgent] = useState<ClippyAgentType>();
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const loadClippy = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const { default: clippy } = await import("clippyts");

      if (!mountedRef.current) {
        loadingRef.current = false;
        return;
      }

      clippy.load({
        failCb: () => {
          loadingRef.current = false;
        },
        name: AGENTS.CLIPPY,
        successCb: (loadedAgent: ClippyAgentType) => {
          if (mountedRef.current) {
            loadedAgent.show(false);
            setAgent(loadedAgent);
          } else {
            loadedAgent.hide(true, () => cleanupClippyDOM());
          }
          loadingRef.current = false;
        },
      });
    } catch {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (clippyEnabled && !agent) {
      loadClippy();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [agent, clippyEnabled, loadClippy]);

  useEffect(() => {
    if (!clippyEnabled && agent) {
      agent.hide(true, () => {
        cleanupClippyDOM();
        setAgent(undefined);
      });
    }
  }, [agent, clippyEnabled]);

  useEffect(() => cleanupClippyDOM, []);

  useAmbientMode(agent, Boolean(clippyEnabled) && clippyMode === "ambient");
  useInteractiveMode(
    agent,
    Boolean(clippyEnabled) && clippyMode === "interactive"
  );

  // eslint-disable-next-line unicorn/no-null
  if (!clippyEnabled) return null;

  return <ClippyStyles />;
};

export default memo(ClippyWrapper);
