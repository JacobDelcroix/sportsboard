import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const source = (path: string) => new URL(`../../src/${path}`, import.meta.url).pathname;

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@jacobdelcroix/sportsboard/basketball/viewer': source('sports/basketball/viewer-entry.ts'),
      '@jacobdelcroix/sportsboard/basketball/editor': source('sports/basketball/editor-entry.ts'),
      '@jacobdelcroix/sportsboard/football/viewer': source('sports/football/viewer-entry.ts'),
      '@jacobdelcroix/sportsboard/football/editor': source('sports/football/editor-entry.ts'),
      '@jacobdelcroix/sportsboard/core': source('core/index.ts'),
      '@jacobdelcroix/sportsboard/viewer': source('viewer/index.ts'),
      '@jacobdelcroix/sportsboard/editor': source('editor/index.ts'),
      '@jacobdelcroix/sportsboard/element': source('element/index.ts')
    }
  },
  server: { port: 5174 },
  build: {
    rollupOptions: {
      input: {
        index: new URL('index.html', import.meta.url).pathname
      }
    }
  }
});
