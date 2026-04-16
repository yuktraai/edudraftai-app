/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:        "var(--navy)",
        "navy-2":    "var(--navy-2)",
        teal:        "var(--teal)",
        "teal-2":    "var(--teal-2)",
        "teal-light":"var(--teal-light)",
        bg:          "var(--bg)",
        surface:     "var(--surface)",
        border:      "var(--border)",
        text:        "var(--text)",
        muted:       "var(--muted)",
        success:     "var(--success)",
        warning:     "var(--warning)",
        error:       "var(--error)",
      },
      fontFamily: {
        heading: ["Plus Jakarta Sans", "sans-serif"],
        body:    ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
