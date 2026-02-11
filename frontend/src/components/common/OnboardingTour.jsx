import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, LayoutDashboard, FileText, Command,
  Sparkles, ChevronRight, X, Rocket,
} from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: Rocket,
    title: 'Welcome to Repurpose.AI',
    description: 'An AI-powered drug repurposing intelligence platform with 18 specialized agents searching biomedical databases in parallel.',
    color: '#FFE600',
  },
  {
    icon: MessageSquare,
    title: 'AI Assistant',
    description: 'Chat naturally with our Master Agent. Ask to analyze drugs, generate reports, compare markets, or explore patent landscapes.',
    color: '#00B4D8',
  },
  {
    icon: Search,
    title: 'Drug Search Pipeline',
    description: '18 agents search PubMed, ClinicalTrials.gov, ChEMBL, USPTO, and more — scoring opportunities across 4 dimensions in real-time.',
    color: '#00D4AA',
  },
  {
    icon: Command,
    title: 'Command Palette',
    description: 'Press Ctrl+K anywhere to quickly navigate, search drugs, or access any feature. Press ? for all keyboard shortcuts.',
    color: '#A78BFA',
  },
  {
    icon: FileText,
    title: 'Export & Reports',
    description: 'Generate professional PDF reports, Excel workbooks, and single-opportunity briefs — all archived for later download.',
    color: '#F472B6',
  },
];

const STORAGE_KEY = 'repurpose-ai-tour-seen';

const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Show tour after a brief delay
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150]"
            onClick={handleSkip}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[151]"
          >
            <div className="bg-brand-slate border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon area */}
              <div className="pt-8 pb-4 flex justify-center">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <Icon className="w-8 h-8" style={{ color: step.color }} />
                </motion.div>
              </div>

              {/* Content */}
              <div className="px-8 pb-6 text-center">
                <motion.h2
                  key={`title-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-bold text-text-primary mb-2"
                >
                  {step.title}
                </motion.h2>
                <motion.p
                  key={`desc-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-sm text-text-secondary leading-relaxed"
                >
                  {step.description}
                </motion.p>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 pb-4">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentStep ? 'bg-brand-yellow' : 'bg-brand-border'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border">
                <button
                  onClick={handleSkip}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Skip tour
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-yellow text-brand-dark rounded-lg text-sm font-semibold hover:bg-brand-yellow/90 transition-colors"
                >
                  {isLast ? 'Get Started' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
