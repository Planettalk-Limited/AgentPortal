/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        '2xs': '380px',
        xs: '440px',
      },
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        'pt-turquoise': {
          DEFAULT: '#24B6C3',
          50: '#AEEBF0',
          100: '#9DE6ED',
          200: '#7BDEE7',
          300: '#58D5E0',
          400: '#36CCDA',
          500: '#24B6C3',
          600: '#1B8A94',
          700: '#135E64',
          800: '#0A3135',
          900: '#010506',
          950: '#000000',
        },
        'pt-dark-gray': {
          DEFAULT: '#404653',
          50: '#9AA1B1',
          100: '#8E96A8',
          200: '#778196',
          300: '#646D81',
          400: '#52596A',
          500: '#404653',
          600: '#282B33',
          700: '#0F1114',
          800: '#000000',
          900: '#000000',
          950: '#000000',
        },
        'pt-light-gray': {
          DEFAULT: '#9D9C9C',
          50: '#F8F8F8',
          100: '#EEEEEE',
          200: '#DADADA',
          300: '#C6C5C5',
          400: '#B1B1B1',
          500: '#9D9C9C',
          600: '#818080',
          700: '#656464',
          800: '#494848',
          900: '#2D2C2C',
          950: '#1E1E1E',
        },
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  corePlugins: {
    container: false,
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
