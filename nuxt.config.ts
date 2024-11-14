// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  // Enable SSG
  ssr: false,
  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: { host: process.env.TAURI_DEV_HOST || 'localhost' },
  modules: ['@unocss/nuxt', '@nuxtjs/i18n', 'nuxtjs-naive-ui'],
  features: {
    inlineStyles: false,
  },
  css: [
    '@unocss/reset/tailwind.css',
    '~/styles/default-theme.css',
    '~/styles/vars.css',
    '~/styles/global.css',
    ...(process.env.TAURI_PLATFORM === 'macos' ? [] : ['~/styles/scrollbars.css']),
  ],
  postcss: {
    plugins: {
      'postcss-nested': {},
    },
  },
  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
  },
})