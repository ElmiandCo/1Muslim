import "./globals.css";
import "./ummah-conversation-polish.css";
import "./deepwatch/deepwatch.css";
import "./adhan.css";
import "./prayer-experience.css";
import "./site-text.css";
import "./badge-effects.css";
import "./hudhud-translate.css";
import "./hudhud-selection.css";
import "./hudhud-live-mini.css";
import Script from "next/script";
import GlobalNavigation from "./components/GlobalNavigation";
import AppShellLifecycle from "./components/AppShellLifecycle";
import XPTracker from "./components/XPTracker";
import SitePresenceHeartbeat from "./components/SitePresenceHeartbeat";
import ElmiLayerX from "./components/ElmiLayerX";
import ImmersiveVideoEntry from "./components/ImmersiveVideoEntry";
import ProfileThemeSync from "./components/ProfileThemeSync";
import SiteChromeTheme from "./components/SiteChromeTheme";
import PersistentQuranStudio from "./components/PersistentQuranStudio";
import PersistentMessengerCall from "./components/PersistentMessengerCall";
import PersistentMuslimSync from "./components/PersistentMuslimSync";
import PersistentDailyVideo from "../components/PersistentDailyVideo";
import OneMuslimShare from "./components/OneMuslimShare";
import HudHudChatLauncher from "./components/HudHudChatLauncher";
import HudHudMotionShell from "./components/HudHudMotionShell";
import HudHudTacticalVision from "./components/HudHudTacticalVision";
import HudHudDimensionDust from "./components/HudHudDimensionDust";
import HudHudSelectionTranslate from "./components/HudHudSelectionTranslate";
import HudHudLiveMiniPlayer from "./components/HudHudLiveMiniPlayer";
import NotificationToaster from "./components/NotificationToaster";
import VisitorFeedback from "./components/VisitorFeedback";
import LocationOnboarding from "./components/LocationOnboarding";
import PersistentAdhan from "./components/PersistentAdhan";
import HudHudVoiceCommands from "./components/HudHudVoiceCommands";

export const viewport = {themeColor:"#ffffff",width:"device-width",initialScale:1,viewportFit:"cover" as const};

export const metadata = {
  metadataBase: new URL("https://1muslim.live"),
  title: "1Muslim.Live — Social Network, Qur’an & Live",
  applicationName: "1Muslim",
  appleWebApp: {capable:true,title:"1Muslim",statusBarStyle:"default" as const},
  icons: {apple:[{url:"/apple-icon",sizes:"180x180",type:"image/png"}],icon:[{url:"/icon.svg",type:"image/svg+xml"},{url:"/app-install-icon",sizes:"512x512",type:"image/png"}]},
  description: "1Muslim.Live is a Muslim social network for profiles, Ummah posts, short videos, Messenger, live streams, Qur’an learning, prayer tools and HudHud AI.",
  category: "social networking",
  openGraph: {
    siteName: "1Muslim",
    title: "1Muslim.Live — Muslim Social Network & Learning",
    description: "Explore 1Muslim.Live: profiles, Ummah posts, short videos, Messenger, live broadcasts, Qur’an tracking, prayer tools, XP and HudHud AI.",
    url: "https://1muslim.live",
    type: "website" as const,
    locale: "en_US"
  },
  twitter: {
    card: "summary" as const,
    title: "1Muslim.Live — Social Network & HudHud AI",
    description: "1Muslim.Live: profiles, posts, videos, followers, Messenger, live streaming, Qur’an progress, prayer tools and HudHud, a Muslim-inspired AI companion."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppShellLifecycle /><SitePresenceHeartbeat /><SiteChromeTheme /><ProfileThemeSync /><HudHudMotionShell><GlobalNavigation />{children}</HudHudMotionShell><ImmersiveVideoEntry /><PersistentMessengerCall /><PersistentMuslimSync /><PersistentDailyVideo /><VisitorFeedback /><LocationOnboarding /><PersistentAdhan /><HudHudDimensionDust /><HudHudChatLauncher /><HudHudTacticalVision /><HudHudSelectionTranslate /><HudHudLiveMiniPlayer /><ElmiLayerX /><XPTracker /><PersistentQuranStudio /><NotificationToaster /><Script src="https://www.googletagmanager.com/gtag/js?id=G-DSLVB0HSGV" strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "G-DSLVB0HSGV");`}</Script></body></html>;
}
