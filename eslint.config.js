import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'public/**',
    'src-tauri/**',
    '**/target/**',
  ],
})
