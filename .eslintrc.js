// default configuration tuned for development
module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 9,
      sourceType: "module",
      project: "./tsconfig.json"
    },
    plugins: ["@typescript-eslint", "jest" ],
    env: {
      node: true,
      es6: true,
      "jest/globals": true
    },
    settings: {
      react: {
        pragma: "React",
        version: "detect"
      }
    },
    ignorePatterns: [
      "build/", "node_modules/"
    ],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:eslint-comments/recommended"
    ],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-confusing-non-null-assertion": "error",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-shadow": ["error", { builtinGlobals: false, hoist: "all", allow: [] }],
      "@typescript-eslint/no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
      "@typescript-eslint/no-var-requires": "off",
      curly: ["error", "multi-line", "consistent"],
      "dot-notation": "error",
      "eol-last": "warn",
      eqeqeq: ["error", "smart"],
      "eslint-comments/no-unused-disable": "warn",
      "no-debugger": "off",
      "no-duplicate-imports": "error",
      "no-sequences": "error",
      "no-shadow": "off", // superceded by @typescript-eslint/no-shadow
      "no-tabs": "error",
      "no-unneeded-ternary": "error",
      "no-unused-expressions": ["error", { allowShortCircuit: true }],
      "no-unused-vars": "off",  // superceded by @typescript-eslint/no-unused-vars
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "no-whitespace-before-property": "error",
      "object-shorthand": "error",
      "prefer-const": "error",
      "prefer-object-spread": "error",
      "prefer-regex-literals": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "quotes": [2, "double", { allowTemplateLiterals: true, avoidEscape: true }],
      radix: "error",
      semi: ["error", "always"]
    },
    overrides: [
      { // some rules can be relaxed in tests
        files: ["**/*.test.*"],
        rules: {
          "@typescript-eslint/no-non-null-assertion": "off",
        }
      },
      {
        files: ["**/setupTests.js", "**/webpack.config.js"],
        rules: {
          "@typescript-eslint/no-require-imports": "off",
          "@typescript-eslint/no-var-requires": "off"
        }
      }
    ]
};
