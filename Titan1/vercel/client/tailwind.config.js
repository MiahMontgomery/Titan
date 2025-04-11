/** @type {import('tailwindcss').Config} */
let theme = {
  primary: "#4a6cf7",
  radius: 0.5
};

// Try to load theme from theme.json, but don't fail if it's not available
try {
  theme = require('./theme.json');
} catch (e) {
  console.warn('theme.json not found, using default theme');
}

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: theme.radius ? `${theme.radius * 0.5}rem` : "0.5rem",
        md: theme.radius ? `${theme.radius * 0.375}rem` : "0.375rem",
        sm: theme.radius ? `${theme.radius * 0.25}rem` : "0.25rem",
      },
      colors: {
        primary: {
          DEFAULT: theme.primary || "#4a6cf7",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        }
      }
    },
  },
  plugins: [
    // Safely try to use tailwindcss-animate, but don't fail if it's not available
    (function() {
      try {
        return require('tailwindcss-animate');
      } catch (e) {
        console.warn('tailwindcss-animate plugin not available, skipping...');
        return {};
      }
    })()
  ],
}