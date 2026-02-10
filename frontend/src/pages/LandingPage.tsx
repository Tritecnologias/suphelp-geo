// Landing Page - página principal
import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Pricing from '../components/Pricing';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

const LandingPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;