import { defineConfig } from 'vite';

// GitHub Pages project site: https://itwasmattgregg.github.io/Star-Wars-Timeline/
// Local dev & other hosts use base '/'
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: {
    open: true,
  },
});
