"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import LiveKitViewer from "./LiveKitViewer";
import LiveChat from "./LiveChat";
import LiveGuestStudio from "./LiveGuestStudio";
import { cinemaKeyboardOffset, type CinemaMode } from "../lib/live-cinema";

type Props = {
  streamId: string;
  roomName: string;
  hostId: string;
  hostName: string;
  title: string;
  hostAvatar?: string | null;
  initialMode?: CinemaMode;
};

/** Only the full-screen viewer uses these controls; the host studio is unchanged. */
export default function LiveCinemaTheater({ streamId, roomName, hostId, hostName, title, hostAvatar, initialMode = "phone" }: Props) {
  const [mode, setMode] = useState<CinemaMode>(initialMode);
  const [commentFocused, setCommentFocused] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => setKeyboardOffset(
      viewport ? cinemaKeyboardOffset(window.innerHeight, viewport.height, viewport.offsetTop) : 0,
    );
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const style = { "--cinema-keyboard-offset": keyboardOffset + "px" } as CSSProperties;

  return (
    <section className="omLiveTheater omLiveCinema" data-cinema-mode={mode} data-comment-focus={commentFocused ? "yes" : "no"} style={style} aria-label="Immersive live broadcast">
      <LiveKitViewer roomName={roomName} streamId={streamId} initialViewMode={initialMode} onViewModeChange={setMode} />
      <div className="omLiveTheaterInfo">
        {hostAvatar && <img src={hostAvatar} alt="" className="omLiveTheaterAvatar" />}
        <div className="omLiveTheaterIdentity"><strong>{hostName}</strong><small>{title}</small></div>
        <span className="omLiveTheaterBadge">● LIVE</span>
      </div>
      <div ref={chatRef} className="omLiveTheaterChat" aria-label="Live comments"
        onFocusCapture={event => {
          if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) setCommentFocused(true);
        }}
        onBlurCapture={() => window.setTimeout(() => {
          setCommentFocused(Boolean(chatRef.current?.contains(document.activeElement) &&
            (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)));
        }, 0)}>
        <LiveChat streamId={streamId} hostId={hostId} overlay />
      </div>
      <details className="omLiveTheaterGuests">
        <summary aria-label="Open guest controls">♧ Guests</summary>
        <div className="omLiveTheaterGuestPanel"><LiveGuestStudio streamId={streamId} roomName={roomName} hostId={hostId} /></div>
      </details>
      <style jsx global>{`
        .omLiveCinema{position:fixed;inset:0;width:100vw;height:100dvh;background:#000;overflow:hidden;z-index:1000;isolation:isolate;--cinema-ease:cubic-bezier(.22,.72,.19,1)}
        .omLiveCinema>.omLiveImmersiveViewer{height:100%!important;min-height:100%!important;aspect-ratio:auto!important}
        .omLiveCinema .omLiveTheaterInfo{position:absolute;top:calc(env(safe-area-inset-top) + 16px);left:70px;right:110px;display:flex;align-items:center;gap:8px;color:#fff;font-size:12px;text-shadow:0 1px 8px #000;pointer-events:none;z-index:20;white-space:nowrap;overflow:hidden}
        .omLiveCinema .omLiveTheaterInfo strong{overflow:hidden;text-overflow:ellipsis}
        .omLiveCinema .omLiveTheaterAvatar{width:35px;height:35px;object-fit:cover;border-radius:50%;border:1px solid #91ffe2;flex:none}
        .omLiveCinema .omLiveTheaterIdentity{display:flex;flex-direction:column;gap:2px;min-width:0}
        .omLiveCinema .omLiveTheaterIdentity small{opacity:.8;overflow:hidden;text-overflow:ellipsis}
        .omLiveCinema .omLiveTheaterBadge{font-size:10px;font-weight:900;padding:6px 9px;border-radius:999px;background:#aa2039;flex:none}
        .omLiveCinema .omLiveTheaterChat{position:absolute;mask-image:linear-gradient(to bottom,transparent 0%,black 18%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 18%);pointer-events:auto}
        .omLiveCinema .omLiveTheaterGuests{position:absolute;right:12px;bottom:calc(env(safe-area-inset-bottom) + 38px);color:#fff}
        .omLiveCinema .omLiveTheaterGuests summary{list-style:none;cursor:pointer;padding:10px 12px;border-radius:999px;background:#09221dbb;border:1px solid #a4e7d16b;backdrop-filter:blur(16px);font-size:12px}
        .omLiveCinema .omLiveTheaterGuests summary::-webkit-details-marker{display:none}
        .omLiveCinema .omLiveTheaterGuestPanel{position:absolute;bottom:48px;right:0;width:min(90vw,390px);max-height:45dvh;overflow:auto;border-radius:18px;background:#081a17ef;border:1px solid #a4e7d14d;padding:10px;backdrop-filter:blur(20px)}

        .omLiveCinema .omLiveCinemaBackdrop{position:absolute;inset:-12%;width:124%;height:124%;object-fit:cover;filter:blur(55px) brightness(.42) saturate(1.2);transform:scale(1.08);pointer-events:none;z-index:0;opacity:.95}
        .omLiveCinema .omLiveVideoStage{position:absolute!important;z-index:1;overflow:hidden!important;transition:top 2s var(--cinema-ease),left 2s var(--cinema-ease),width 2s var(--cinema-ease),height 2s var(--cinema-ease),border-radius 2s var(--cinema-ease),transform 2s var(--cinema-ease);will-change:width,height,top,left}
        .omLiveCinema[data-cinema-mode="phone"] .omLiveVideoStage{top:0!important;left:0!important;width:100%!important;height:100%!important;transform:none!important;border-radius:0!important}
        .omLiveCinema[data-cinema-mode="desktop"] .omLiveVideoStage{top:clamp(125px,18dvh,220px)!important;left:50%!important;width:calc(100% - 24px)!important;max-width:1200px!important;height:min(56.25vw,675px)!important;transform:translateX(-50%)!important;border-radius:18px!important;box-shadow:0 12px 45px #0009;border:1px solid #ffffff44}
        .omLiveCinema[data-cinema-mode="desktop"] .omLiveVideoStage .omCameraVideo{object-fit:contain!important}
        .omLiveCinema[data-cinema-mode="phone"] .omLiveVideoStage .omCameraVideo{object-fit:cover!important}
        .omLiveCinema .omLiveVideoStage .omScreenVideo{object-fit:contain!important}
        .omLiveCinema .omCinemaModeSwitch{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 96px);z-index:27;display:flex;flex-direction:column;gap:8px}
        .omLiveCinema .omCinemaModeSwitch button{min-width:94px;min-height:44px;border:1px solid #ffffff66;border-radius:14px;background:#071711bd;color:#fff;font-size:12px;font-weight:800;backdrop-filter:blur(14px);cursor:pointer}
        .omLiveCinema .omCinemaModeSwitch button[aria-pressed="true"]{border-color:#d8c18a;background:#183d32e8;box-shadow:0 0 16px #c8a65e44}
        .omLiveCinema .omLiveViewerToolbar{left:auto!important;right:12px!important;bottom:calc(env(safe-area-inset-bottom) + 80px)!important;display:flex!important;flex-direction:column!important;align-items:flex-end!important;max-width:140px;gap:8px!important;z-index:24!important}
        .omLiveCinema .omCinemaAudioButton{min-height:44px;min-width:48px;background:rgba(120,18,31,.62)!important;border:1px solid #ff7e89a6!important;backdrop-filter:blur(14px);color:#fff!important}
        .omLiveCinema .omCinemaAudioButton[data-audible="yes"]{background:rgba(8,111,66,.66)!important;border-color:#6dffc2a6!important}
        .omLiveCinema .omLiveTheaterChat{left:12px;bottom:calc(env(safe-area-inset-bottom) + 12px + var(--cinema-keyboard-offset,0px));width:min(78vw,390px);height:clamp(210px,34dvh,320px);z-index:31;pointer-events:auto;transition:bottom .12s ease}
        .omLiveCinema .omLiveTheaterChat .liveChat{height:100%;min-height:0}
        .omLiveCinema .omLiveTheaterChat .composer input{font-size:16px!important;min-height:44px}
        .omLiveCinema .omLiveTheaterChat .composer button{min-height:44px;min-width:48px}
        .omLiveCinema .omLiveTheaterChat .emoteTray{flex-wrap:nowrap;overflow-x:auto;min-height:44px;padding:3px 4px}
        .omLiveCinema .omLiveTheaterChat .messages{min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
        .omLiveCinema[data-comment-focus="yes"] .omLiveTheaterChat{height:min(32dvh,230px);max-height:calc(100dvh - var(--cinema-keyboard-offset,0px) - 100px);width:min(94vw,390px)}
        .omLiveCinema[data-comment-focus="yes"] .omLiveTheaterGuests{display:none}
        .omLiveCinema .omLiveTheaterGuests{z-index:32}
        .omLiveCinema .omViewerExit{z-index:40}
        @media(max-width:700px){.omLiveCinema .omLiveVideoStage video{width:100%!important;height:100%!important}.omLiveCinema .omLiveTheaterChat{width:min(78vw,330px)}.omLiveCinema[data-comment-focus="yes"] .omLiveTheaterChat{width:min(94vw,390px)}}
        @media(prefers-reduced-motion:reduce){.omLiveCinema .omLiveVideoStage,.omLiveCinema .omLiveTheaterChat{transition:none!important}}
      `}</style>
    </section>
  );
}
