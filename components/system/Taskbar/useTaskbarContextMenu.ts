import { useMemo } from "react";
import { useMenu } from "contexts/menu";
import {
  type ContextMenuCapture,
  type MenuItem,
} from "contexts/menu/useMenuContextState";
import { useProcesses } from "contexts/process";
import { useSession } from "contexts/session";
import { useViewport } from "contexts/viewport";
import { useProcessesRef } from "hooks/useProcessesRef";
import { AI_TITLE, MENU_SEPERATOR } from "utils/constants";
import { toggleShowDesktop } from "utils/functions";
import { useWebGPUCheck } from "hooks/useWebGPUCheck";
import { useWindowAI } from "hooks/useWindowAI";

const useTaskbarContextMenu = (onStartButton = false): ContextMenuCapture => {
  const { contextMenu } = useMenu();
  const { minimize, open } = useProcesses();
  const {
    aiEnabled,
    clippyEnabled,
    clippyMode,
    setAiEnabled,
    setClippyEnabled,
    setClippyMode,
    stackOrder,
  } = useSession();
  const processesRef = useProcessesRef();
  const { fullscreenElement, toggleFullscreen } = useViewport();
  const hasWebGPU = useWebGPUCheck();
  const hasWindowAI = useWindowAI();

  return useMemo(
    () =>
      contextMenu?.(() => {
        const processArray = Object.entries(processesRef.current);
        const allWindowsMinimized =
          processArray.length > 0 &&
          !processArray.some(([, { minimized }]) => !minimized);
        const toggleLabel = allWindowsMinimized
          ? "Show open windows"
          : "Show the desktop";
        const menuItems: MenuItem[] = [
          {
            action: () =>
              toggleShowDesktop(processesRef.current, stackOrder, minimize),
            label: onStartButton ? "Desktop" : toggleLabel,
          },
        ];

        if (onStartButton) {
          menuItems.unshift(
            {
              action: () => open("Terminal"),
              label: "Terminal",
            },
            MENU_SEPERATOR,
            {
              action: () => open("FileExplorer"),
              label: "File Explorer",
            },
            {
              action: () => open("Run"),
              label: "Run",
            },
            MENU_SEPERATOR
          );
        } else {
          menuItems.unshift(
            {
              action: () => toggleFullscreen(),
              label:
                fullscreenElement === document.documentElement
                  ? "Exit full screen"
                  : "Enter full screen",
            },
            MENU_SEPERATOR,
            ...(hasWebGPU && !hasWindowAI
              ? [
                  {
                    action: () => setAiEnabled(!aiEnabled),
                    checked: aiEnabled,
                    label: `Show ${AI_TITLE} button`,
                  },
                  MENU_SEPERATOR,
                ]
              : []),
            {
              label: "Virtual Assistant",
              menu: [
                {
                  action: () => setClippyEnabled(!clippyEnabled),
                  checked: clippyEnabled,
                  label: "Show Clippy",
                },
                MENU_SEPERATOR,
                {
                  action: () => setClippyMode("ambient"),
                  checked: clippyMode === "ambient",
                  label: "Ambient Mode",
                },
                {
                  action: () => setClippyMode("interactive"),
                  checked: clippyMode === "interactive",
                  label: "Interactive Mode",
                },
              ],
            },
            MENU_SEPERATOR
          );
        }

        return menuItems;
      }),
    [
      aiEnabled,
      clippyEnabled,
      clippyMode,
      contextMenu,
      fullscreenElement,
      hasWebGPU,
      hasWindowAI,
      minimize,
      onStartButton,
      open,
      processesRef,
      setAiEnabled,
      setClippyEnabled,
      setClippyMode,
      stackOrder,
      toggleFullscreen,
    ]
  );
};

export default useTaskbarContextMenu;
