/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#08080F',
          surface: '#0F0F1A',
          elevated: '#161625',
        },
        border: '#1F1F35',
        accent: '#7C6AF7',
        'accent-glow': 'rgba(124, 106, 247, 0.15)',
        success: '#10D9A0',
        warning: '#F5A623',
        danger: '#FF4D6D',
        'text-primary': '#EEEEF5',
        'text-secondary': '#7878A0',
        'text-muted': '#3D3D60',
      },
      fontFamily: {
        mono: ['DM Mono', 'monospace'],
        heading: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 106, 247, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 106, 247, 0.5)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
