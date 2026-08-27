/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Instrument Serif'", 'Georgia', 'serif'],
        body: ["'Barlow'", 'Arial', 'sans-serif'],
      },
      colors: {
        ink: '#050505',
        pearl: '#f4f1ea',
        signal: '#d8ff66',
      },
    },
  },
  plugins: [],
}
