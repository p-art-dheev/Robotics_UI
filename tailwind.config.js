/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        biodegradable: '#10B981',
        nonbiodegradable: '#EF4444',
        recyclable: '#3B82F6',
        hazardous: '#F97316',
        metal: '#6B7280',
        paper: '#F59E0B',
        glass: '#06B6D4'
      },
      backgroundImage: {
        'hero-pattern': "url('https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
      }
    }
  },
  plugins: [],
} 