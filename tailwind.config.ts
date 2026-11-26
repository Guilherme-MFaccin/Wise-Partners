import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      // Fonte do sistema (apple-design 15): SF Pro no Mac e no iPhone, Segoe UI no Windows, Roboto no Android.
      // display: a versão arredondada do sistema (SF Pro Rounded) para números de destaque e títulos públicos.
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "system-ui", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"],
        display: ["ui-rounded", '"SF Pro Rounded"', "-apple-system", "BlinkMacSystemFont", "system-ui", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      // Escala com entrelinha e espaçamento por tamanho: o texto grande aperta, o pequeno abre
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.004em" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "-0.006em" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.011em" }],
        lg: ["1.125rem", { lineHeight: "1.625rem", letterSpacing: "-0.014em" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.017em" }],
        "2xl": ["1.5rem", { lineHeight: "1.95rem", letterSpacing: "-0.019em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.021em" }],
        "4xl": ["2.25rem", { lineHeight: "2.55rem", letterSpacing: "-0.022em" }],
        "5xl": ["3rem", { lineHeight: "1.08", letterSpacing: "-0.024em" }],
        "6xl": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.026em" }],
        "7xl": ["4.5rem", { lineHeight: "1.02", letterSpacing: "-0.028em" }],
      },
      transitionTimingFunction: {
        // Curvas da casa: saída suave para entrar, e a curva das folhas e diálogos
        saida: "cubic-bezier(0.23, 1, 0.32, 1)",
        folha: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        warning: "hsl(var(--warning))",
        // Cores que acompanham o tema (claro e escuro): ver src/index.css
        white: "rgb(var(--tinta) / <alpha-value>)",
        menta: {
          900: "#0d4d37", 800: "#0a6b48", 700: "#00905e", 600: "#00b877", 500: "#00e193",
          400: "rgb(var(--m-400) / <alpha-value>)", 300: "rgb(var(--m-300) / <alpha-value>)",
          200: "rgb(var(--m-200) / <alpha-value>)", 100: "#c3fbe2",
        },
        neutro: {
          1000: "#000000", 900: "rgb(var(--n-900) / <alpha-value>)", 800: "rgb(var(--n-800) / <alpha-value>)",
          700: "rgb(var(--n-700) / <alpha-value>)", 500: "rgb(var(--n-500) / <alpha-value>)",
          300: "rgb(var(--n-300) / <alpha-value>)", 100: "rgb(var(--n-100) / <alpha-value>)",
        },
        red: { 200: "rgb(var(--r-200) / <alpha-value>)", 300: "rgb(var(--r-300) / <alpha-value>)" },
        sky: { 300: "rgb(var(--s-300) / <alpha-value>)" },
        violet: { 200: "rgb(var(--v-200) / <alpha-value>)", 300: "rgb(var(--v-300) / <alpha-value>)" },
        chart: {
          1: "hsl(var(--chart-1))", 2: "hsl(var(--chart-2))", 3: "hsl(var(--chart-3))", 4: "hsl(var(--chart-4))", 5: "hsl(var(--chart-5))",
          muted: "hsl(var(--chart-muted))", grid: "hsl(var(--chart-grid))", axis: "hsl(var(--chart-axis))",
        },
        // Branco literal, para texto sobre foto, vídeo ou cor sólida que não muda com o tema
        puro: "#ffffff",
        nivel: { elite: "#111827", dourado: "#D97706", premium: "#1E3A8A", select: "#365314" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 4px)", sm: "calc(var(--radius) - 6px)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        // Faixa de logos das landing pages: a lista vem duplicada e anda metade da largura, sem emenda
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: { "accordion-down": "accordion-down 0.2s ease-out", "accordion-up": "accordion-up 0.2s ease-out", marquee: "marquee 60s linear infinite" },
    },
  },
  plugins: [animate, typography],
} satisfies Config;
