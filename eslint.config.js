// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore build output
  globalIgnores(['dist']),

  // ----- Base JS/JSX rules -----
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // For JS files use base rule
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // ----- Add TypeScript presets (linting without type-checking; fastest) -----
  // These presets include sensible defaults for TS and scope themselves to *.ts/*.tsx.
  ...tseslint.configs.recommended,

  // ----- TS/TSX file-specific tweaks -----
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // Tip: leave "project" out for speed. Add it below if you want type-aware rules.
      },
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    // You can still use your React Hooks/Refresh in TS too, if desired:
    extends: [
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    rules: {
      // Turn off base rule in TS files to avoid duplicate reports
      'no-unused-vars': 'off',
      // Prefer the TS version
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // ----- OPTIONAL: enable type-aware rules (slower, but catches more) -----
  // Uncomment EVERYTHING in this block and ensure tsconfig.json is at project root.
  // Also add the preset: ...tseslint.configs.recommendedTypeChecked (below).
  // {
  //   files: ['**/*.{ts,tsx}'],
  //   languageOptions: {
  //     parser: tseslint.parser,
  //     parserOptions: {
  //       ecmaVersion: 'latest',
  //       sourceType: 'module',
 //       ecmaFeatures: { jsx: true },
 //       project: ['./tsconfig.json'],
 //       tsconfigRootDir: new URL('.', import.meta.url).pathname,
 //     },
  //     globals: globals.browser,
  //   },
  // },
  // ...tseslint.configs.recommendedTypeChecked,
])
