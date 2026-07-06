/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terracotta: '#FF6B35',
        'dark-blue': '#44808F',
        pacificblue: '#3996AE',
        editor: {
          canvas: '#EDEFEF',
          surface: '#F6F7F7',
          border: '#E3E6E7',
          text: '#23292B',
          muted: '#6B7478',
          faint: '#98A0A2',
          brand: '#3F5459',
          accent: '#FF6B57',
          accentSoft: '#EEF3F3',
          track: '#F0F1F1',
          success: '#1E6B45',
          successBg: '#E4F5EC',
          warning: '#B5622F',
          warningBg: '#FFF1EA',
          warningBorder: '#FFDCC8',
          error: '#C0392B',
          errorBg: '#FBE9E9',
          errorPill: '#FBE1E1',
          errorBorder: '#F0C4C4',
          errorStrike: '#B03434',
          disabled: '#C7CBCC',
          input: '#D9DCDD',
          code: '#23292B',
          codeText: '#D8E0E1',
        },
      },
      boxShadow: {
        'editor-shell': '0 20px 50px -20px rgba(20,30,32,0.35)',
        'editor-segment': '0 1px 2px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
