/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        brand: {
          dark: '#0a0f1a',      // Main background
          darker: '#060912',    // Sidebar/cards
          navy: '#0d1829',      // Secondary background
          slate: '#1a2332',     // Card backgrounds
          border: '#243044',    // Border color
          yellow: '#FFE600',    // EY Yellow - primary accent
          teal: '#00D4AA',      // Teal - success/positive
          cyan: '#00B4D8',      // Cyan - info/links
        },
        // Semantic Colors
        success: '#00D4AA',
        warning: '#FFB800',
        error: '#FF4757',
        info: '#00B4D8',
        // Confidence Levels
        confidence: {
          veryHigh: '#00D4AA',
          high: '#4ADE80',
          moderate: '#FFE600',
          low: '#FFB800',
          veryLow: '#FF4757',
        },
        // Text Colors
        text: {
          primary: '#FFFFFF',
          secondary: '#94A3B8',
          muted: '#64748B',
          accent: '#FFE600',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #0a0f1a 0%, #0d1829 50%, #1a2332 100%)',
        'glow-yellow': 'radial-gradient(circle at center, rgba(255, 230, 0, 0.15) 0%, transparent 70%)',
        'glow-teal': 'radial-gradient(circle at center, rgba(0, 212, 170, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(255, 230, 0, 0.1)',
        'glow-md': '0 0 30px rgba(255, 230, 0, 0.15)',
        'glow-lg': '0 0 45px rgba(255, 230, 0, 0.2)',
        'glow-teal': '0 0 30px rgba(0, 212, 170, 0.15)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'score-fill': 'scoreFill 1s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 230, 0, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 230, 0, 0.4)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scoreFill: {
          '0%': { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--score-offset)' },
        },
      },
    },
  },
  plugins: [],
}
