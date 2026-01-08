"use client";
import AppAppBar from '@/components/AppAppBar/AppAppBar';
import Hero from '@/components/Hero/Hero';
import Featured from '@/components/Features/Features';
import Highlights from '@/components/Highlights/Highlights';
import Functions from '@/components/Functions/Functions';
import Pricing from '@/components/Pricing/Pricing';
import Precios from '@/components/Pricing/Precios';
import FolioPackages from '@/components/FolioPackages/folioPackages';
import Contact from '@/components/contact/contact';
import Footer from '@/components/Footer/Footer';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();
    return (
        <div>
            <AppAppBar />
            <Hero />
            <Featured />
            <Highlights />
            <FolioPackages />
            <Contact />
            <Footer />
        </div>
    );
}
