import dynamic from "next/dynamic";
import { memo } from "react";
import AppsLoader from "components/system/Apps/AppsLoader";
import Desktop from "components/system/Desktop";
import Taskbar from "components/system/Taskbar";
import useGlobalErrorHandler from "hooks/useGlobalErrorHandler";
import useGlobalKeyboardShortcuts from "hooks/useGlobalKeyboardShortcuts";
import useGreetingLoader from "hooks/useGreetingLoader";
import useIFrameFocuser from "hooks/useIFrameFocuser";
import useS3ConnectionLoader from "hooks/useS3ConnectionLoader";
import useSessionAppsLoader from "hooks/useSessionAppsLoader";
import useUrlLoader from "hooks/useUrlLoader";

const Clippy = dynamic(() => import("components/system/Clippy"), {
  ssr: false,
});

const Index = (): React.ReactElement => {
  useIFrameFocuser();
  useUrlLoader();
  useSessionAppsLoader();
  useS3ConnectionLoader();
  useGreetingLoader();
  useGlobalKeyboardShortcuts();
  useGlobalErrorHandler();

  return (
    <Desktop>
      <Taskbar />
      <AppsLoader />
      <Clippy />
    </Desktop>
  );
};

export default memo(Index);
