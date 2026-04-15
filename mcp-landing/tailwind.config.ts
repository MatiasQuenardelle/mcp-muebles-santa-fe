import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#FAF8F3',
          dark: '#1A1714',
          gold: '#C4A245',
          'gold-light': '#D4B85A',
          green: '#25D366',
          'green-hover': '#1EBE5C',
          muted: '#6B6560',
          'muted-dark': '#A39E96',
          border: '#E8E4DC',
          card: '#F3F0E8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(37, 211, 102, 0.3)',
        'glow-gold': '0 0 30px rgba(196, 162, 69, 0.15)',
        'elevated': '0 20px 50px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}

export default config
