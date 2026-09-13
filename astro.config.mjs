import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://djontheline.com',
  base: '/',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
