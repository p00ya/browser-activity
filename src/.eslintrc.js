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
      },
    },
  ],
};
