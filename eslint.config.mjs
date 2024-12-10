// @ts-check
import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    unocss: true,
    vue: {},
    ignores: [
      'public/**',
      'src-tauri/**',
      '',
    ],
  },
  {
    rules: {
      // TODO: migrate all process reference to `import.meta.env` and remove this rule
      'node/prefer-global/process': 'off',
    },
  },
)
