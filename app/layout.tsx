import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "OneMuslim — Start where you are.",
  description: "A welcoming Muslim platform for learning, community, media, and discovery."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<Script src="https://www.googletagmanager.com/gtag/js?id=G-DSLVB0HSGV" strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];\nfunction gtag(){window.dataLayer.push(arguments);}\ngtag("js", new Date());\ngtag("config", "G-DSLVB0HSGV");`}</Script></body></html>;
}
