import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import AboutSection from "@/components/aboutUsSection";
import ContactSection from "@/components/ContactSection";
import { Server } from "node:http";
import ServicesSection from "@/components/ServicesSection";
import HomeServices from "@/components/HomeServices";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <AboutSection />
      <HomeServices />
      <ContactSection />
      <Footer />
    </main>
  );
}
