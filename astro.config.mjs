import { defineConfig } from 'astro/config';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const defaultBase = repository && !repository.endsWith('.github.io') ? `/${repository}/` : '/';

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || (owner ? `https://${owner}.github.io` : 'https://example.com'),
  base: process.env.BASE_PATH || defaultBase,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
