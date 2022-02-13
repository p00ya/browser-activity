// Sets up linting for configuration files (*.js).
// Linting for the actual source files is controlled separately from
// src/.eslintrc.js.

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: 'airbnb-base',
  ignorePatterns: ['dist/*'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'eol-last': 'error',
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
