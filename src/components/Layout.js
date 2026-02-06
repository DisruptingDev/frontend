import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import Head from 'next/head';

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