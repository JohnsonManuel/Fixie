import React from "react";
import HeroSection from "../components/HeroSection";
import SEOHead from "../components/SEOHead";
import "../styles/App.css";
import "../styles/KeyCapabilities.css";
import ProblemStatement from "../components/ProblemStatement";
import ProductionFlow from "../components/ProductionFlow";
import HowItWorks from "../components/HowItWorks";
import MoreInfo from "../components/MoreInfo";
import Layout from "./Layout";
import { Features } from "../components/Features";
import { ProductHighlights } from "../components/ProductHighlights";
import { WhyUs } from "../components/WhyUs";
import TabsWithRightCard from "../components/Steps";
import { AnimatedBeamMultipleOutputDemo } from "../components/usecases";
import { AnimatedListDemo } from "../components/IntegrationsList";
import { OrbitingCirclesDemo } from "../components/OrbitDemo";
import HorizontalFeatureStepper from "../components/stepper";
import { useNavigate } from "react-router-dom";
import { getPageSEO } from "../utils/seoConfig";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const seo = getPageSEO('home');

  return (
    <Layout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={seo.canonical}
        structuredData={seo.structuredData}
      />
      {/* Hero section with "Book Demo" or CTA buttons */}
      <HeroSection onDemoClick={() => navigate("/demo")} />

      <div className="w-full pt-5 bg-white dark:bg-neutral-900">
        <div className="w-[80%] h-1 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
      </div>

      <Features />

      <div className="w-full pt-5 bg-white dark:bg-neutral-900">
        <div className="w-[80%] h-1 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
      </div>

      <ProblemStatement />
      <ProductHighlights />
      {/* <HowItWorks /> */}
      <TabsWithRightCard />
      {/* <HorizontalFeatureStepper /> */}
      {/* <AnimatedBeamMultipleOutputDemo /> */}
      {/* <AnimatedListDemo /> */}
      {/* <OrbitingCirclesDemo /> */}

      <WhyUs onDemoClick={() => navigate("/demo")} />
      <MoreInfo />

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Product</h4>
              <a onClick={() => navigate("/#features")}>Features</a>
              <a onClick={() => navigate("/#integrations")}>Integrations</a>
              <a onClick={() => navigate("/#pricing")}>Pricing</a>
            </div>

            <div className="footer-section">
              <h4>Company</h4>
              <a onClick={() => navigate("/#about")}>About</a>
              <a onClick={() => navigate("/#careers")}>Careers</a>
              <a onClick={() => navigate("/#contact")}>Contact</a>
            </div>

            <div className="footer-section">
              <h4>Resources</h4>
              <a onClick={() => navigate("/#docs")}>Documentation</a>
              <a onClick={() => navigate("/#blog")}>Blog</a>
              <a onClick={() => navigate("/#support")}>Support</a>
            </div>

            <div className="footer-section">
              <h4>Legal</h4>
              <a onClick={() => navigate("/#privacy")}>Privacy</a>
              <a onClick={() => navigate("/#terms")}>Terms</a>
              <a onClick={() => navigate("/#security")}>Security</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 Fixie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default LandingPage;
