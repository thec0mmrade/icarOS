import { useEffect, useRef } from "react";
import { useProcesses } from "contexts/process";
import { getSearchParam } from "utils/functions";

const useGreetingLoader = (): void => {
  const { open } = useProcesses();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;

    const greeting = getSearchParam("greeting");
    if (greeting.toLowerCase() === "sprocket") {
      loadedRef.current = true;
      // Small delay to let session apps load first
      setTimeout(() => open("SprocketGreeting"), 500);
    }
  }, [open]);
};

export default useGreetingLoader;
