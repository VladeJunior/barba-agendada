import { useEffect, useRef } from "react";

export function ArcadeEmbed() {
  const arcadeIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onArcadeIframeMessage(e: MessageEvent) {
      if (e.origin !== "https://demo.arcade.software" || !e.isTrusted) return;

      const arcadeIframe = arcadeIframeRef.current;
      if (!arcadeIframe || !arcadeIframe.contentWindow) return;

      if (e.data.event === "arcade-init") {
        arcadeIframe.contentWindow.postMessage(
          { event: "register-popout-handler" },
          "*"
        );
      }

      if (e.data.event === "arcade-popout-open") {
        arcadeIframe.style.position = "fixed";
        arcadeIframe.style.zIndex = "9999999";
      }

      if (e.data.event === "arcade-popout-close") {
        arcadeIframe.style.position = "absolute";
        arcadeIframe.style.zIndex = "auto";
      }
    }

    window.addEventListener("message", onArcadeIframeMessage);

    const arcadeIframe = arcadeIframeRef.current;
    if (arcadeIframe && arcadeIframe.contentWindow) {
      arcadeIframe.contentWindow.postMessage(
        { event: "register-popout-handler" },
        "*"
      );
    }

    return () => {
      if (arcadeIframe && arcadeIframe.contentWindow) {
        arcadeIframe.contentWindow.postMessage(
          { event: "unregister-popout-handler" },
          "*"
        );
      }

      window.removeEventListener("message", onArcadeIframeMessage);
    };
  }, []);

  return (
    <div style={{ position: 'relative', paddingBottom: 'calc(51.49094781682641% + 41px)', height: '0', width: '100%' }}>
      <iframe
        src="https://demo.arcade.software/spk9P1y4KglNIem1KFZH?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
        title="Visualizar e Gerenciar Relatórios e Recursos do Sistema para Barbearia"
        frameBorder="0"
        loading="lazy"
        allowFullScreen
        allow="clipboard-write"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light' }}
      />
    </div>
  );
}
