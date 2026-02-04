import { useEffect, useRef } from "react";
import { useFileSystem } from "contexts/fileSystem";
import { useProcesses } from "contexts/process";
import { useSession } from "contexts/session";
import { PROCESS_DELIMITER } from "utils/constants";

const useSessionAppsLoader = (): void => {
  const { exists, fs } = useFileSystem();
  const { open, processes } = useProcesses();
  const { sessionLoaded, windowStates } = useSession();
  const loadedSessionAppsRef = useRef(false);

  useEffect(() => {
    if (
      loadedSessionAppsRef.current ||
      !fs ||
      !sessionLoaded ||
      !open ||
      Object.keys(processes).length > 0
    ) {
      return;
    }

    loadedSessionAppsRef.current = true;

    const openSessionApps = async (): Promise<void> => {
      const delay = (ms: number): Promise<void> =>
        new Promise((resolve) => {
          setTimeout(resolve, ms);
        });

      for (const processId of Object.keys(windowStates)) {
        const [app, url] = processId.split(PROCESS_DELIMITER);

        if (app && url) {
          const isUrl = url.startsWith("http://") || url.startsWith("https://");
          const fileExists = isUrl || (await exists(url));

          if (fileExists) {
            const { delay: windowDelay } = windowStates[processId];

            if (windowDelay) await delay(windowDelay);

            open(app, { url });
          }
        }
      }
    };

    openSessionApps();
  }, [exists, fs, open, processes, sessionLoaded, windowStates]);
};

export default useSessionAppsLoader;
