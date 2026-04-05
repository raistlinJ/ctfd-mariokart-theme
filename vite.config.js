import { defineConfig } from 'vite';
import { resolve } from 'path';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  base: './',
  build: {
    outDir: 'static',
    manifest: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'assets/js/index.js'),
        main: resolve(__dirname, 'assets/scss/main.scss'),
        challenges: resolve(__dirname, 'assets/js/challenges.js'),
        scoreboard: resolve(__dirname, 'assets/js/scoreboard.js'),
        settings: resolve(__dirname, 'assets/js/settings.js'),
        setup: resolve(__dirname, 'assets/js/setup.js'),
        page: resolve(__dirname, 'assets/js/page.js'),
        teams: resolve(__dirname, 'assets/js/teams.js'),
        users: resolve(__dirname, 'assets/js/users.js'),
        notifications: resolve(__dirname, 'assets/js/notifications.js'),
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
  plugins: [
    copy({
      targets: [
        { src: 'assets/img/*', dest: 'static/img' },
        { src: 'node_modules/@fortawesome/fontawesome-free/webfonts/*', dest: 'static/webfonts' },
      ],
      hook: 'writeBundle'
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "assets/scss/variables";`
      }
    }
  }
});
