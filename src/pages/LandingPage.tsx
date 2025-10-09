import React from "react";
import HeroSection from "../components/HeroSection";
import "../styles/App.css";
import "../styles/KeyCapabilities.css";
import ProblemStatement from "../components/ProblemStatement";
import ProductionFlow from "../components/ProductionFlow";
import HowItWorks from "../components/HowItWorks";
import MoreInfo from "../components/MoreInfo";
import Layout  from "./Layout";
import { Features } from '../components/Features'
import { ProductHighlights } from "../components/ProductHighlights";
import { WhyUs } from "../components/WhyUs";
import TabsWithRightCard  from "../components/Steps";
import { AnimatedBeamMultipleOutputDemo } from "../components/usecases";
import { AnimatedListDemo } from '../components/IntegrationsList';
import { OrbitingCirclesDemo } from "../components/OrbitDemo";
import HorizontalFeatureStepper from '../components/stepper';

interface LandingPageProps {
  onNavigate: React.Dispatch<
    React.SetStateAction<
      | "home"
      | "signup"
      | "login"
      | "dashboard"
      | "servicenow-alternative"
      | "enterprise-itsm"
      | "servicenow-migration"
      | "fortune500-itsm"
      | "demo"
    >
  >;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <Layout onNavigate={onNavigate}>
      <HeroSection onDemoClick={() => onNavigate("demo")} />
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
      <WhyUs />
      <MoreInfo />
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#integrations">Integrations</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#careers">Careers</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <a href="#docs">Documentation</a>
              <a href="#blog">Blog</a>
              <a href="#support">Support</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
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
