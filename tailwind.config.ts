import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme palette
        background: '#0f0f0f',
        surface: '#1a1a1a',
        'surface-2': '#222222',
        border: '#2a2a2a',
        'border-light': '#333333',
        // Text
        'text-primary': '#f5f5f5',
        'text-secondary': '#a0a0a0',
        'text-muted': '#666666',
        // Accent - warm gold
        accent: '#c9a84c',
        'accent-hover': '#d4b461',
        'accent-dim': '#c9a84c33',
        // States
        danger: '#e05252',
        success: '#52a852',
        warning: '#e09a52',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(201,168,76,0.15)',
        'card': '0 2px 8px rgba(0,0,0,0.4)',
        'modal': '0 8px 32px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
