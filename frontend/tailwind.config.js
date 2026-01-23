/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // EY-inspired healthcare theme
        brand: {
          yellow: '#FFE600',
          gold: '#FFC700',
          amber: '#FFB300',
          dark: '#1a1a2e',
          darker: '#141425',
          charcoal: '#2E2E38',
        },
        // Healthcare accents
        health: {
          teal: '#00A8B5',
          blue: '#0077B6',
          green: '#00C853',
          mint: '#00E5A0',
        },
        // Keep pharma for backwards compatibility (updated colors)
        pharma: {
          primary: '#FFE600',
          secondary: '#00A8B5',
          accent: '#FFC700',
          success: '#00C853',
          warning: '#FFB300',
          danger: '#FF4444',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 230, 0, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 230, 0, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #1a1a2e 0%, #2E2E38 50%, #1a1a2e 100%)',
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(255, 230, 0, 0.3)',
        'glow-teal': '0 0 20px rgba(0, 168, 181, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
