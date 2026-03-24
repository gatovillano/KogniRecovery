/**
 * Configuración de ESLint para KogniRecovery
 *
 * Basada en las mejores prácticas de:
 * - React Native
 * - TypeScript
 * - Expo
 */

module.exports = {
  extends: [
    'expo',
    'expo/typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // React
    'react/react-in-jsx-scope': 'off', // No necesario en React Native
    'react/prop-types': 'off', // Usamos TypeScript
    'react/display-name': 'off',
    'react-native/no-inline-styles': 'warn',

    // General
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'prettier/prettier': 'error',

    // Import order
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {},
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    '.expo/',
    'coverage/',
    '*.config.js',
  ],
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};