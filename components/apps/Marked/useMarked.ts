import { basename } from "path";
import { useCallback, useEffect } from "react";
import { type ContainerHookProps } from "components/system/Apps/AppContainer";
import useTitle from "components/system/Window/useTitle";
import { useFileSystem } from "contexts/fileSystem";
import { useProcesses } from "contexts/process";
import { loadFiles } from "utils/functions";
import { useLinkHandler } from "hooks/useLinkHandler";

type MarkdownIt = {
  render: (markdownString: string) => string;
};

declare global {
  interface Window {
    DOMPurify: {
      sanitize: (text: string) => string;
    };
    markdownit: () => MarkdownIt;
  }
}

const useMarked = ({
  containerRef,
  id,
  loading,
  setLoading,
  url,
}: ContainerHookProps): void => {
  const { readFile } = useFileSystem();
  const { prependFileToTitle } = useTitle(id);
  const { processes: { [id]: { libs = [] } = {} } = {} } = useProcesses();
  const openLink = useLinkHandler();
  const getContainer = useCallback(
    (): HTMLElement | null =>
      containerRef.current?.querySelector("article") as HTMLElement,
    [containerRef]
  );
  const loadFile = useCallback(async () => {
    const markdownFile = await readFile(url);
    const container = getContainer();

    if (container instanceof HTMLElement) {
      container.classList.remove("drop");
      container.innerHTML = window.DOMPurify.sanitize(
        window.markdownit().render(markdownFile.toString())
      );
      container
        .querySelectorAll("a")
        .forEach((link) =>
          link.addEventListener("click", (event) =>
            openLink(
              event,
              link.href || "",
              link.pathname,
              link.textContent || ""
            )
          )
        );
      container.scrollTop = 0;
    }

    prependFileToTitle(basename(url));
  }, [getContainer, openLink, prependFileToTitle, readFile, url]);

  useEffect(() => {
    if (loading) {
      loadFiles(libs).then(() => {
        if (window.markdownit) {
          setLoading(false);
        }
      });
    }
  }, [libs, loading, setLoading]);

  useEffect(() => {
    if (!loading) {
      if (url) loadFile();
      else getContainer()?.classList.add("drop");
    }
  }, [getContainer, loadFile, loading, url]);
};

export default useMarked;
