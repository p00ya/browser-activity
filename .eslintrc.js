// Sets up linting for configuration files (*.js).
// Linting for the actual source files is controlled separately from
// src/.eslintrc.js.

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:jsonc/recommended-with-json',
  ],
  ignorePatterns: ['dist/*'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'eol-last': 'error',
    'import/order': ['error', {
      alphabetize: { order: 'asc' },
      'newlines-between': 'never',
    }],
    'jsonc/indent': ['error', 2],
    'jsonc/object-curly-spacing': ['error', 'always'],
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
