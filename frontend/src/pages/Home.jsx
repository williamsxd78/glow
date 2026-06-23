import React from "react";
import Hero from "../components/sections/Hero";
import Story from "../components/sections/Story";
import VideoSection from "../components/sections/VideoSection";
import HowItsMade from "../components/sections/HowItsMade";
import Features from "../components/sections/Features";
import Lifestyle from "../components/sections/Lifestyle";
import Gallery from "../components/sections/Gallery";
import Specs from "../components/sections/Specs";
import Reviews from "../components/sections/Reviews";
import Faq from "../components/sections/Faq";
import CountdownStrip from "../components/sections/Countdown";

export default function Home() {
  return (
    <main>
      <Hero />
      <CountdownStrip />
      <Story />
      <VideoSection />
      <HowItsMade />
      <Features />
      <Lifestyle />
      <Gallery />
      <Specs />
      <Reviews />
      <Faq />
    </main>
  );
}
