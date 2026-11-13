const config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3B82F6',   /* 500 — primary blue */
          light:   '#60A5FA',   /* 400 — soft sky blue tint */
          hover:   '#2563EB',   /* 600 — hover state */
          active:  '#1D4ED8',   /* 700 — pressed / dark active */
          subtle:  'rgba(59, 130, 246, 0.10)', /* icon bg, soft pill */
          bloom:   'rgba(59, 130, 246, 0.20)', /* hovered icon bg */
          glow:    'rgba(59, 130, 246, 0.35)', /* box-shadow glow */
        }
      }
    }
  },
  plugins: []
};

export default config;

