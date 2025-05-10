/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        typography: {
          DEFAULT: {
            css: {
              color: 'inherit',
              a: {
                color: '#3182ce',
                '&:hover': {
                  color: '#2c5282',
                },
              },
            },
          },
        },
      },
    },
    plugins: [
      require('@tailwindcss/line-clamp'),
      require('@tailwindcss/typography'),
    ],
  }