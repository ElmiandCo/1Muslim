import "./globals.css";
import "./site-text.css";
import "./badge-effects.css";
import Script from "next/script";
import XPTracker from "./components/XPTracker";
import NotificationToaster from "./components/NotificationToaster";

export const metadata = {
  title: "OneMuslim — Start where you are.",
  description: "A welcoming Muslim platform for learning, community, media, and discovery."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<XPTracker /><NotificationToaster /><Script src="https://www.googletagmanager.com/gtag/js?id=G-DSLVB0HSGV" strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "G-DSLVB0HSGV");`}</Script></body></html>;
}
