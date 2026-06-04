/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F7F7F4',
        surface: '#FFFFFF',
        border: '#E8E8E3',
        ink: '#111111',
        muted: '#888888',
        primary: '#FF3D00',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Orbitron', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      },
      animation: {
        'glitch':        'glitch 4s infinite',
        'float':         'float 3s ease-in-out infinite',
        'vs-pulse':      'vsPulse 1.8s ease-in-out infinite',
        'vs-rotate':     'vsRotate 10s linear infinite',
        'vs-rotate-rev': 'vsRotateRev 7s linear infinite',
        'shake':         'shake 0.4s ease-in-out',
        'blink':         'blink 1s step-end infinite',
        'fade-up':       'fadeUp 0.35s ease-out forwards',
        'slide-left':    'slideLeft 0.35s ease-out forwards',
        'slide-right':   'slideRight 0.35s ease-out forwards',
      },
      keyframes: {
        glitch: {
          '0%, 88%, 100%': { transform: 'translate(0)' },
          '90%': { transform: 'translate(-2px, 1px)' },
          '92%': { transform: 'translate(2px, -1px)' },
          '94%': { transform: 'translate(-1px, 2px)' },
          '96%': { transform: 'translate(1px, -1px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        vsPulse: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '1'   },
          '50%':      { transform: 'scale(1.08)', opacity: '0.9' },
        },
        vsRotate:    { '100%': { transform: 'rotate(360deg)'  } },
        vsRotateRev: { '100%': { transform: 'rotate(-360deg)' } },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)'  },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to:   { opacity: '1', transform: 'translateX(0)'     },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
      },
    },
  },
  plugins: [],
}
