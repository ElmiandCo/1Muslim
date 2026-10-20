import "./globals.css";
import "./site-text.css";
import "./badge-effects.css";
import "./hudhud-translate.css";
import "./hudhud-selection.css";
import "./hudhud-live-mini.css";
import Script from "next/script";
import XPTracker from "./components/XPTracker";
import ProfileThemeSync from "./components/ProfileThemeSync";
import PersistentWidgetDock from "./components/PersistentWidgetDock";
import PersistentQuranStudio from "./components/PersistentQuranStudio";
import PersistentMessengerCall from "./components/PersistentMessengerCall";
import PersistentDailyVideo from "../components/PersistentDailyVideo";
import OneMuslimShare from "./components/OneMuslimShare";
import HudHudChatLauncher from "./components/HudHudChatLauncher";
import HudHudMotionShell from "./components/HudHudMotionShell";
import HudHudTacticalVision from "./components/HudHudTacticalVision";
import TapShimmer from "./components/TapShimmer";
import HudHudDimensionDust from "./components/HudHudDimensionDust";
import HudHudSelectionTranslate from "./components/HudHudSelectionTranslate";
import HudHudLiveMiniPlayer from "./components/HudHudLiveMiniPlayer";
import NotificationToaster from "./components/NotificationToaster";
import GuestWelcomeGate from "./components/GuestWelcomeGate";
import HudHudVoiceCommands from "./components/HudHudVoiceCommands";

export const metadata = {
  title: "1Muslim",
  applicationName: "1Muslim",
  appleWebApp: {capable:true,title:"1Muslim",statusBarStyle:"black-translucent" as const},
  icons: {apple:[{url:"/apple-icon",sizes:"180x180",type:"image/png"}],icon:[{url:"/icon.svg",type:"image/svg+xml"},{url:"/app-install-icon",sizes:"512x512",type:"image/png"}]},
  description: "A welcoming Muslim platform for learning, community, media, and discovery."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ProfileThemeSync /><HudHudMotionShell>{children}</HudHudMotionShell><PersistentMessengerCall /><PersistentDailyVideo /><GuestWelcomeGate /><HudHudDimensionDust /><TapShimmer /><HudHudChatLauncher /><HudHudTacticalVision /><HudHudSelectionTranslate /><HudHudLiveMiniPlayer /><XPTracker /><PersistentWidgetDock /><PersistentQuranStudio /><NotificationToaster /><Script src="https://www.googletagmanager.com/gtag/js?id=G-DSLVB0HSGV" strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "G-DSLVB0HSGV");`}</Script></body></html>;
}
