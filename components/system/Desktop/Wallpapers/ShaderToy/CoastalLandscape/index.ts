import { SYSTEM_PATH } from "utils/constants";
import { loadFiles } from "utils/functions";

declare global {
  interface Window {
    effectInit: (canvas: HTMLCanvasElement) => void;
  }
}

export const libs = [
  `${SYSTEM_PATH}/ShaderToy/CoastalLandscape/piLibs.js`,
  `${SYSTEM_PATH}/ShaderToy/CoastalLandscape/effect.js`,
  `${SYSTEM_PATH}/ShaderToy/CoastalLandscape/init.js`,
];

const CoastalLandscape = async (el?: HTMLElement | null): Promise<void> => {
  if (!el) return;

  await loadFiles(libs);

  const canvas = document.createElement("canvas");

  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;

  window.effectInit(canvas);

  el.append(canvas);
};

export default CoastalLandscape;
