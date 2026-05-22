// @ts-check
import { defineConfig } from 'astro/config';


import svelte from '@astrojs/svelte';

// @ts-ignore: optional dev dependency may not have type declarations in this environment
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte({extensions: ['.svelte']}), tailwind()],
});