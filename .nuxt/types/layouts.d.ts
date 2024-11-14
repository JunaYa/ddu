import type { ComputedRef, MaybeRef } from 'vue'
export type LayoutKey = string
declare module "../../node_modules/.pnpm/nuxt@3.14.159_@types+node@22.9.0_eslint@9.14.0_rollup@4.26.0_typescript@5.6.3_vite@5.4.11_vue-tsc@2.1.10/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false>
  }
}