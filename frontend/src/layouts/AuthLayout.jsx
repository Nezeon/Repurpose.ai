import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dna } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 230, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 230, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-yellow/10 rounded-xl flex items-center justify-center">
            <Dna className="w-7 h-7 text-brand-yellow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Repurpose<span className="text-brand-yellow">.AI</span>
            </h1>
            <p className="text-xs text-text-muted">Drug Intelligence Platform</p>
          </div>
        </Link>

        {/* Auth card */}
        <div className="bg-brand-slate/50 backdrop-blur-xl border border-brand-border rounded-2xl p-8 shadow-xl">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted mt-6">
          &copy; {new Date().getFullYear()} Repurpose.AI. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
