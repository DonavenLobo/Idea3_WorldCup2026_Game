import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoGaffa",
  description: "Create your tournament card, play daily trivia, and compete with your groups."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
