import "./globals.css";
import "./site-text.css";
import "./badge-effects.css";
import "./hudhud-translate.css";
import "./hudhud-selection.css";
import "./hudhud-live-mini.css";
import Script from "next/script";
import XPTracker from "./components/XPTracker";
import HudHudChatLauncher from "./components/HudHudChatLauncher";
import HudHudTacticalVision from "./components/HudHudTacticalVision";
import TapShimmer from "./components/TapShimmer";
import HudHudDimensionDust from "./components/HudHudDimensionDust";
import HudHudSelectionTranslate from "./components/HudHudSelectionTranslate";
import HudHudLiveMiniPlayer from "./components/HudHudLiveMiniPlayer";
import NotificationToaster from "./components/NotificationToaster";
import GuestWelcomeGate from "./components/GuestWelcomeGate";
import ElmiLightJourney from "./components/ElmiLightJourney";\nimport HudHudVoiceCommands from "./components/HudHudVoiceCommands";

export const metadata = {
  title: "OneMuslim — Start where you are.",
  description: "A welcoming Muslim platform for learning, community, media, and discovery."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<GuestWelcomeGate /><ElmiLightJourney /><HudHudDimensionDust /><TapShimmer /><HudHudChatLauncher /><HudHudTacticalVision /><HudHudSelectionTranslate /><HudHudLiveMiniPlayer /><HudHudVoiceCommands /><XPTracker /><NotificationToaster /><Script src="https://www.googletagmanager.com/gtag/js?id=G-DSLVB0HSGV" strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "G-DSLVB0HSGV");`}</Script></body></html>;
}
