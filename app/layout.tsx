import type { Metadata } from 'next';
import { DM_Sans, Lato, Montserrat, Poppins } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
  display: 'swap',
  adjustFontFallback: true,
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-lato',
  display: 'swap',
  adjustFontFallback: true,
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-montserrat',
  display: 'swap',
  adjustFontFallback: true,
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
  display: 'swap',
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'DC Space',
  description: 'TAP. ATTEND. GET CERTIFIED.',
  icons: {
    icon: {
      url: '/dcspace-logos/dcspace-logo-circle.png',
      type: 'image/png',
      sizes: '32x32',
    },
    shortcut: '/dcspace-logos/dcspace-logo-circle.png',
    apple: {
      url: '/dcspace-logos/dcspace-logo-circle.png',
      type: 'image/png',
      sizes: '180x180',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${lato.variable} ${montserrat.variable} ${poppins.variable} ${dmSans.className}`}>
        {children}
      </body>
    </html>
  );
}
