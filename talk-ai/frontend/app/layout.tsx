import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalkCraft AI - Real-Time Spoken English & Grammar Coach',
  description: 'Master spoken English with real-time AI conversation, instant grammar correction, sentence framing, Tamil explanations, and female voice synthesis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
