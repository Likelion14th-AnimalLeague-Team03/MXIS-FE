/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F3FAF7",
          100: "#DFF3EC",
          500: "#33A474",
          600: "#24865D",
          900: "#12392B"
        }
      }
    }
  },
  plugins: []
};
