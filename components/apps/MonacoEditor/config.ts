import { PROGRAM_FILES_PATH } from "utils/constants";

export const config = {
  paths: {
    vs: `${PROGRAM_FILES_PATH}/MonacoEditor/vs`,
  },
};

export const theme = "vs-dark";

export const customExtensionLanguages: Record<string, string> = {
  ".whtml": ".html",
};

export const URL_DELIMITER = "|";
