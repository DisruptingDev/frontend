"use client";
import AppAppBar from '@/components/AppAppBar/AppAppBar';
import Hero from '@/components/Hero/Hero';
import TrustBar from '@/components/TrustBar/TrustBar';
import FeaturesShowcase from '@/components/FeaturesShowcase/FeaturesShowcase';
import TargetAudience from '@/components/TargetAudience/TargetAudience';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import FolioPackages from '@/components/FolioPackages/folioPackages';
import ComparisonTable from '@/components/Comparison/ComparisonTable';
import Testimonials from '@/components/Testimonials/Testimonials';
import FAQ from '@/components/FAQ/FAQ';
import Contact from '@/components/contact/contact';
import Footer from '@/components/Footer/Footer';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';

export default function HomePage() {
    return (
        <main className="w-full">
            <AppAppBar />
            <Hero />
            <TrustBar />
            <FeaturesShowcase />
            <TargetAudience />
            <HowItWorks />
            <FolioPackages />
            <ComparisonTable />
            <Testimonials />
            <FAQ />
            <Contact />
            <Footer />
            <WhatsAppButton />
        </main>
    );
}
