/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#0a0d14',
          surface: '#11151e',
          card: '#181d28',
          border: 'rgba(255, 255, 255, 0.10)',
        },
        glass: {
          base: 'rgba(255, 255, 255, 0.05)',
          card: 'rgba(255, 255, 255, 0.07)',
          elevated: 'rgba(255, 255, 255, 0.10)',
          stroke: 'rgba(255, 255, 255, 0.12)',
          'stroke-subtle': 'rgba(255, 255, 255, 0.08)',
        },
        accent: {
          blue: '#0a84ff', // Apple System Blue
          purple: '#bf5af2', // Apple System Purple
          green: '#30d158', // Apple System Green
          red: '#ff453a', // Apple System Red
          amber: '#ffd60a', // Apple System Yellow
          cyan: '#64d2ff', // Apple System Cyan
        },
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'rgba(30, 41, 59, 0.90)',
          foreground: '#f8fafc',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
        },
      },
      boxShadow: {
        'vision': '0 12px 40px 0 rgba(0, 0, 0, 0.25)',
        'vision-elevated': '0 24px 64px 0 rgba(0, 0, 0, 0.38)',
        'vision-float': '0 32px 80px 0 rgba(0, 0, 0, 0.45)',
        'glow-blue': '0 0 24px rgba(10, 132, 255, 0.35)',
        'glow-purple': '0 0 24px rgba(191, 90, 242, 0.35)',
        'glow-green': '0 0 24px rgba(48, 209, 88, 0.35)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Inter',
          'sans-serif',
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'squircle': '20px',
        'squircle-lg': '26px',
      }
    },
  },
  plugins: [],
}
