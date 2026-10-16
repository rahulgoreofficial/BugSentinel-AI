import React from 'react';
import { HeroSection } from '../../components/landing/HeroSection';
import { CapabilityStrip } from '../../components/landing/CapabilityStrip';
import { WorkflowSection } from '../../components/landing/WorkflowSection';
import { FeatureShowcase } from '../../components/landing/FeatureShowcase';
import { ProductValueSection } from '../../components/landing/ProductValueSection';
import { FinalCallToAction } from '../../components/landing/FinalCallToAction';

interface LandingPageProps {
  onOpenDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenDashboard }) => {
  return (
    <div className="landing-page-wrapper">
      <HeroSection onOpenDashboard={onOpenDashboard} />
      <CapabilityStrip />
      <WorkflowSection />
      <FeatureShowcase />
      <ProductValueSection onOpenDashboard={onOpenDashboard} />
      <FinalCallToAction onOpenDashboard={onOpenDashboard} />
    </div>
  );
};
