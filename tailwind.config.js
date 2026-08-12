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
        },
        concierge: {
          bg: "#FAF6F1",
          surface: "#FFFFFF",
          surfaceMuted: "#F2EBE5",
          chip: "#F6F5F2",
          border: "#DBDBD6",
          borderLight: "#DDD8D4",
          primary: "#814C27",
          accent: "#E4AB7C",
          text: "#121212",
          textSecondary: "#63635E",
          textMuted: "#746E69"
        }
      }
    }
  },
  plugins: []
};
