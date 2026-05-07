"use client";

import Hero from "@/components/landing/Hero";
import Marquee from "@/components/landing/Marquee";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Infographics from "@/components/landing/Infographics";
import TelegramCard from "@/components/landing/TelegramCard";
import Footer, { Quote } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="page-in">
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <Infographics />
      <Quote />
      <TelegramCard />
      <Footer />
    </div>
  );
}
