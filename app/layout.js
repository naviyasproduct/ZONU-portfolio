import localFont from "next/font/local";
import { Mulish } from "next/font/google";
import "./globals.css";
import Nav from './components/Nav';
import ClientThemeWrapper from './components/ClientThemeWrapper';

const mainFont = localFont({
  src: "../public/fonts/Orbitron-VariableFont_wght.ttf",
  variable: "--font-main",
  display: "swap",
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  display: "swap",
});

export const metadata = {
  title: "ZONU",
  description: "Personal portfolio with thoughts and projects",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${mainFont.variable} ${mulish.variable} antialiased`}
        style={{ margin: 0, padding: 0 }}
      >
        <ClientThemeWrapper>
          <Nav />
          <main className="app-main">
            {children}
          </main>
        </ClientThemeWrapper>
      </body>
    </html>
  );
}
