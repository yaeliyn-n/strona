/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html", // Skanuje główny plik HTML Reacta
      "./src/**/*.{js,ts,jsx,tsx}", // Skanuje wszystkie pliki JS/TS/JSX/TSX w folderze src
    ],
    darkMode: 'class', // Umożliwia przełączanie motywu za pomocą klasy 'dark' na elemencie html
    theme: {
      extend: {
        colors: {
          // Definicje kolorów na podstawie Twoich zmiennych CSS
          // Możesz je tutaj zmapować, aby używać ich bezpośrednio w klasach Tailwind
          // np. bg-primary-color, text-accent-color
          // Alternatywnie, używaj var(--nazwa-zmiennej) bezpośrednio w klasach Tailwind, np. bg-[var(--bg-primary)]
          'primary-color': 'var(--bg-primary)',
          'secondary-color': 'var(--bg-secondary)',
          'card-color': 'var(--bg-card)',
          'header-color': 'var(--bg-header)',
          'text-primary-color': 'var(--text-primary)',
          'text-secondary-color': 'var(--text-secondary)',
          'text-accent-color': 'var(--text-accent)',
          'text-accent-hover-color': 'var(--text-accent-hover)',
          'text-premium-color': 'var(--text-premium)',
          'text-premium-hover-color': 'var(--text-premium-hover)',
          'text-amber-400-custom': 'var(--text-amber-400)', // Niestandardowa nazwa, aby uniknąć konfliktu
          'text-cyan-400-custom': 'var(--text-cyan-400)',   // Niestandardowa nazwa
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          serif: ['Lora', 'serif'],
        },
        // Możesz rozszerzyć inne aspekty motywu Tailwind
      },
    },
    plugins: [],
  }
  