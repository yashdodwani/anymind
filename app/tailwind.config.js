/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontWeight: {
        'normal': '700',
        'bold': '700',
        'semibold': '700',
        'medium': '700',
      },
      letterSpacing: {
        'tight': '-0.02em',
        'normal': '-0.02em',
      },
      colors: {
        // Ethereum-themed colors (primary theme)
        ethereum: {
          50: '#f0f4ff',   // Very light blue
          100: '#e0e9ff',  // Light blue
          200: '#c7d8ff',  // Soft blue
          300: '#a4bfff',  // Medium blue
          400: '#7a9fff',  // Blue accent
          500: '#627eea',  // Primary Ethereum blue
          600: '#4a5cd4',  // Darker blue
          700: '#3b4bb3',  // Deep blue
          800: '#2e3a8a',  // Very deep blue
          900: '#1e2654',  // Darkest blue
        },
        // Keep mantle colors as alias to ethereum for backward compatibility
        mantle: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d8ff',
          300: '#a4bfff',
          400: '#7a9fff',
          500: '#627eea',
          600: '#4a5cd4',
          700: '#3b4bb3',
          800: '#2e3a8a',
          900: '#1e2654',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        accent: {
          50: '#ecfdf5',   // Light green
          100: '#d1fae5',  // Soft green
          200: '#a7f3d0',  // Medium green
          300: '#6ee7b7',  // Bright green
          400: '#34d399',  // Green accent
          500: '#10b981',  // Primary green
          600: '#059669',  // Darker green
          700: '#047857',  // Deep green
          800: '#065f46',  // Very deep green
          900: '#064e3b',  // Darkest green
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      transitionDuration: {
        '250': '250ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
