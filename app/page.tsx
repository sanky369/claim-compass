import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { LogoStrip } from "@/components/logo-strip";
import { ProblemSection } from "@/components/problem-section";
import { Differentiation } from "@/components/differentiation";
import { FeatureGrid } from "@/components/feature-grid";
import { HowItWorks } from "@/components/how-it-works";
import { Comparison } from "@/components/comparison";
import { DenialDecoder } from "@/components/denial-decoder";
import { Testimonials } from "@/components/testimonials";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <LogoStrip />
        <ProblemSection />
        <Differentiation />
        <DenialDecoder />
        <FeatureGrid />
        <HowItWorks />
        <Comparison />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
