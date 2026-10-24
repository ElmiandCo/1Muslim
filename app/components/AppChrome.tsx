"use client";
import {usePathname} from "next/navigation";
import ProfileThemeSync from "./ProfileThemeSync";
import PersistentWidgetDock from "./PersistentWidgetDock";
import PersistentQuranStudio from "./PersistentQuranStudio";
import PersistentMessengerCall from "./PersistentMessengerCall";
import PersistentDailyVideo from "../../components/PersistentDailyVideo";
import OneMuslimShare from "./OneMuslimShare";
import HudHudChatLauncher from "./HudHudChatLauncher";
import HudHudMotionShell from "./HudHudMotionShell";
import HudHudTacticalVision from "./HudHudTacticalVision";
import HudHudDimensionDust from "./HudHudDimensionDust";
import HudHudSelectionTranslate from "./HudHudSelectionTranslate";
import HudHudLiveMiniPlayer from "./HudHudLiveMiniPlayer";
import NotificationToaster from "./NotificationToaster";
import GuestWelcomeGate from "./GuestWelcomeGate";
import XPTracker from "./XPTracker";
export default function AppChrome({children}:{children:React.ReactNode}){
 const path=usePathname();
 if(path==="/streaming/go-live-design")return <>{children}</>;
 return <><ProfileThemeSync/><HudHudMotionShell>{children}</HudHudMotionShell><PersistentMessengerCall/><PersistentDailyVideo/><GuestWelcomeGate/><HudHudDimensionDust/><HudHudChatLauncher/><HudHudTacticalVision/><HudHudSelectionTranslate/><HudHudLiveMiniPlayer/><XPTracker/><PersistentWidgetDock/><PersistentQuranStudio/><NotificationToaster/></>;
}
