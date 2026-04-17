/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        workerSurface: "#ffffff",
        workerMuted: "#f4f2fb",
        workerBorder: "#e8e4f5",
        primary: "#FF5722",
        accent: "#990000",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        background: "#000000",
        card: "#111111",
        textPrimary: "#FFFFFF",
        textSecondary: "#A0A0A0",
        borderColor: "#222222",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: "0 4px 24px rgba(255, 87, 34, 0.15)",
        button: "0 4px 15px rgba(153, 0, 0, 0.5)",
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
        input: "8px",
        pill: "24px",
      }
    },
  },
  plugins: [],
}
