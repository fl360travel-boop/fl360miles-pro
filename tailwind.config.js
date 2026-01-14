/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#E2BE6A',
                    dark: '#B8952E',
                    light: '#F1D18A',
                },
                'emerald-custom': '#10B981',
                'emerald-dark': '#064E3B',
                'bg-dark': '#0A0D11',
                'bg-surface': '#16191E',
                'bg-card': '#1C2229',
                gold: '#E2BE6A',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
                display: ['Cinzel', 'serif'],
            },
        },
    },
    plugins: [],
}
