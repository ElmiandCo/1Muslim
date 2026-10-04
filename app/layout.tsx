import "./globals.css";

export const metadata = {
  title: "OneMuslim — Start where you are.",
  description: "A welcoming Muslim platform for learning, community, media, and discovery."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
