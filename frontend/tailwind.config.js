/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        customBlue: "var(--bs-dark-blue)",
        customBlue100: "#696cffd9",
        color: "var(--text-color)",
      },
      borderRadius: {
        radiusRegular: "var(--border-radius)",
        radiusLg: "var(--border-radius-lg)", 
        radiusFull:"var(--border-radius-full)",
      },
      fontFamily: {
        primary: "var(--font-family)", 
      },
      fontWeight: {
        headingweight: "var(--font-weight-heading)", 
        regularweight: "var(--font-weight-regular)", 
      },
      fontSize: {
        size: "var(--font-size-heading)",
        btnsize:"var(--font-size-btn)",
      },
         marginBottom: {
        size: "10px", // Matches --margin-bottom value
      },

    },
  },
  plugins: [],
};
