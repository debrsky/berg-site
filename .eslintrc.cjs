module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    browser: true
  },
  plugins: ["sonarjs", "prettier", "json"],
  extends: [
    // 'eslint:recommended',
    "semistandard",
    "plugin:sonarjs/recommended",
    "plugin:json/recommended",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2021
  },
  ignorePatterns: ["public", "src/vendor"],
  rules: {}
};

// TODO разобраться, почему в VSCODE не работает автоформатирование json-файлов.
