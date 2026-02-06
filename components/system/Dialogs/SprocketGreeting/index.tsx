import { memo, useCallback, useEffect } from "react";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import StyledSprocketGreeting from "components/system/Dialogs/SprocketGreeting/StyledSprocketGreeting";
import { useProcesses } from "contexts/process";
import { haltEvent } from "utils/functions";

const YOUTUBE_URL = "https://www.youtube.com/watch?v=QHZR9SA5pOg";

const SprocketGreeting: FC<ComponentProcessProps> = ({ id }) => {
  const { closeWithTransition, processes } = useProcesses();
  const componentWindow = processes[id]?.componentWindow;

  const handleDance = useCallback(() => {
    closeWithTransition(id);
    window.open(YOUTUBE_URL, "_blank", "noopener,noreferrer");
  }, [closeWithTransition, id]);

  const handleClose = useCallback(() => {
    closeWithTransition(id);
  }, [closeWithTransition, id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        haltEvent(event);
        handleClose();
      }
    };

    componentWindow?.addEventListener("keydown", handleKeyDown);

    return () => {
      componentWindow?.removeEventListener("keydown", handleKeyDown);
    };
  }, [componentWindow, handleClose]);

  return (
    <StyledSprocketGreeting>
      <h1>Hello, Sprocket Security!</h1>
      <p>
        While doing my reconnaissance on your domain, I discovered something
        interesting hiding in your DNS TXT records...
      </p>
      <div className="terminal">
        <code className="command">$ dig sprocketsecurity.com txt +short</code>
        <pre>
          {`"apple-domain-verification=mzJ5uTm4Pvx7G5AT"
"bw=wNClQ06j3J47Hj8k6RG2JDh1EsLmE68piK4JVcFpMudK"
"figma-domain-verification=ad05cdca7801049ab8e817cf758b1f8722e7914861245bb373b275eb9f0daf25-1768334463"
"google-site-verification=FH1M0WGOzRQGb5KhOpeyqGc05n-zW-lFUDOxVf5oLXc"
"google-site-verification=YgW1gn7ldCNv89-m-O1hBgHVmqEMfpNxrcllNf2miSc"
`}
          <span className="highlight">{`"https://www.youtube.com/watch?v=QHZR9SA5pOg"`}</span>
          {`
"knowbe4-site-verification=77f5e98904b726ce6dfe0e8458de7e25"
"notion-domain-verification=V1CEYsIpuauLbvf87Pfqj5PHp8kuzlExL1IDQuEVQqS"
"openai-domain-verification=dv-nAw63YHB6mo0TsF8f5UUYGTo"
"ppe-7f8c9667686f073a0c50d9a66431a2f13e536824"
"v=spf1 include:u9648730.wl231.sendgrid.net ..."`}
        </pre>
      </div>
      <p className="cta">
        Y&apos;all seem like my kind of fun! Let&apos;s work together!
      </p>
      <nav>
        <button className="secondary" onClick={handleClose} type="button">
          Maybe Later
        </button>
        <button className="primary" onClick={handleDance} type="button">
          Und Now We Dance!
        </button>
      </nav>
    </StyledSprocketGreeting>
  );
};

export default memo(SprocketGreeting);
