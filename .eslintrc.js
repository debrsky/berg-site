module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  plugins: ["svelte3", "sonarjs", "prettier", "json"],
  extends: [
    // 'eslint:recommended',
    "semistandard",
    "plugin:sonarjs/recommended",
    "plugin:json/recommended",
    "plugin:prettier/recommended"
  ],
  // пока не работает
  // https://github.com/sveltejs/eslint-plugin-svelte3/issues/41
  //
  // overrides: [
  //   {
  //     files: ['**/*.svelte'],
  //     processor: 'svelte3/svelte3'
  //   }
  // ],
  parserOptions: {
    ecmaVersion: 2021
  },
  ignorePatterns: ["public", "**/vendor/*.js"],
  rules: {}
};

// TODO разобраться, почему в VSCODE не работает автоформатирование json-файлов.
