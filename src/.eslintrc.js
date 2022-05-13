// SPDX-License-Identifier: MPL-2.0

module.exports = {
  overrides: [
    {
      files: ['*.ts'],
      env: {
        browser: true,
        es2020: true,
        node: false,
        webextensions: true,
      },
      extends: [
        'airbnb-typescript/base',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
      },
      plugins: [
        '@typescript-eslint',
      ],
      rules: {
        'no-restricted-syntax': [
          'off',
          {
            selector: 'ForOfStatement',
          },
        ],
        // Stripped in production by webpack/terser anyway.
        'no-console': 'off',
        // AirBnB is too opinionated about control flows.
        'no-continue': 'off',
        // Keep all properties in the class body rather than split across
        // the constructor parameter list and the body.  We can't consolidate
        // on parameter properties because they don't support #name for private
        // properties.
        '@typescript-eslint/no-parameter-properties': 'error',
        // Don't complain about dependencies for test-only code.
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: ['**/*.test.ts', 'src/testutils/*.ts'] },
        ],
      },
    },
  ],
};
