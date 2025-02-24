import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      colors: {
        primary: "#0f0f0f",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    }
  },

  plugins: [forms]
} satisfies Config;
