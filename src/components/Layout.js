import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import Head from 'next/head';
import pkg from '../../package.json';

if (typeof window !== "undefined") {
  window.APP_VERSION = pkg.version;
}

export default function Layout({ children }) {
  return (
    <>
      <Head>
        {/* Otros meta tags */}
      </Head>
      {children}
      <WhatsAppButton />
    </>
  );
}