module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#1877F2',
          600: '#0E4F99',
          700: '#0A3A7A',
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        orbit: "orbit calc(var(--duration) * 1s) linear infinite",
        "line-shadow": "line-shadow 15s linear infinite",
      },
      keyframes: {
        orbit: {
          "0%": {
            transform:
              "rotate(calc(var(--angle) * 1deg)) translateY(calc(var(--radius) * 1px)) rotate(calc(var(--angle) * -1deg))",
          },
          "100%": {
            transform:
              "rotate(calc(var(--angle) * 1deg + 360deg)) translateY(calc(var(--radius) * 1px)) rotate(calc((var(--angle) * -1deg) - 360deg))",
          },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "line-shadow": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "100% -100%" },
        },
      },
    },
  },
  plugins: [],
};
