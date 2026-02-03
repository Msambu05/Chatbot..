/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Izingcweti ICT Solutions - Warm Artistic Colors
        'warmgold': {
          50: '#FFFAF0',
          100: '#FFE8D6',
          200: '#FFD4B0',
          300: '#FFC08A',
          400: '#FFAC64',
          500: '#FF9500',
          600: '#FF8C00',
          700: '#FF6B35',
          800: '#D63230',
          900: '#8B3A00',
        },
        'brand': {
          gold: '#FF9500',
          orange: '#FF6B35',
          red: '#D63230',
          yellow: '#FFD700',
          light: '#FFFAF0',
        },
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #FF6B35 0%, #FF9500 50%, #FFD700 100%)',
        'gradient-orange': 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FF9500 0%, #FFD700 100%)',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 15px 50px rgba(255, 107, 53, 0.2)',
        'warm-lg': '0 25px 60px rgba(255, 107, 53, 0.3)',
      },
    },
  },
  plugins: [],
}

