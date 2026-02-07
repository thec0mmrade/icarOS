import { memo, useEffect, useRef, useState } from "react";
import StyledHexEdit from "components/apps/HexEdit/StyledHexEdit";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import StyledLoading from "components/system/Apps/StyledLoading";
import { useProcesses } from "contexts/process";
import { useSession } from "contexts/session";
import { IFRAME_CONFIG, ONE_TIME_PASSIVE_EVENT } from "utils/constants";

const HEXED_URL = "https://hexed.it/";

const HexEdit: FC<ComponentProcessProps> = ({ id }) => {
  const { foregroundId, setForegroundId } = useSession();
  const {
    linkElement,
    processes: { [id]: process },
  } = useProcesses();
  const { url = "" } = process || {};
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (foregroundId !== id) {
      iframeRef.current?.contentWindow?.addEventListener(
        "click",
        () => setForegroundId(id),
        ONE_TIME_PASSIVE_EVENT
      );
    }
  }, [foregroundId, id, setForegroundId]);

  useEffect(() => {
    if (loaded && iframeRef.current) {
      linkElement(id, "peekElement", iframeRef.current);
    }
  }, [id, linkElement, loaded]);

  return (
    <StyledHexEdit $loaded={loaded}>
      {!loaded && <StyledLoading className="loading" />}
      <iframe
        ref={iframeRef}
        height="100%"
        id={`hexed-${id}`}
        onLoad={() => setLoaded(true)}
        src={url || HEXED_URL}
        title={id}
        width="100%"
        {...IFRAME_CONFIG}
      />
    </StyledHexEdit>
  );
};

export default memo(HexEdit);
