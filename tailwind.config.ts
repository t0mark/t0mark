import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // variables.css → Tailwind 매핑
        primary: '#2c3e50',
        'primary-light': '#34495e',
        secondary: '#6c757d',
        'secondary-light': '#adb5bd',
        'text-base': '#333',
        'text-light': '#6c757d',
        'text-muted': '#495057',
        bg: '#fff',
        'bg-light': '#f8f9fa',
        'bg-gray': '#f1f3f4',
        border: '#e9ecef',
        'border-light': '#dee2e6',
        'border-dark': '#ced4da',
        'accent-research': '#7c3aed',
        'accent-industry': '#0ea5e9',
        'accent-hardware': '#10b981',
      },
      height: {
        nav: '64px',
      },
      maxWidth: {
        container: '1200px',
        main: '1800px',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '16px',
        xl: '20px',
        full: '50px',
      },
      boxShadow: {
        card: '0 4px 6px rgba(0,0,0,0.07)',
        hover: '0 10px 15px rgba(0,0,0,0.12)',
        float: '0 20px 25px rgba(0,0,0,0.1)',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
