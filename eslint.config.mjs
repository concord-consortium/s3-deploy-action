import typescriptEslint, { configs as tsConfigs } from "typescript-eslint";
import js from "@eslint/js";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import tsParser from "@typescript-eslint/parser";

export default typescriptEslint.config(
  {
    name: "ignores",
    ignores: [
      "deploy-path/dist/",
      "dist/",
      "lib/",
      "node_models/",
    ]
  },
  js.configs.recommended,
  tsConfigs.recommended,
  tsConfigs.stylistic,
  comments.recommended,
  {
    name: "general rules",
    languageOptions: {
      parser: tsParser,
      // We're currently using node v20, so 2023 looks good: https://node.green/#ES2023
      ecmaVersion: 2023,
      // TODO: It isn't clear if this is the right setting for this repo
      sourceType: "module"
    },
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-confusing-non-null-assertion": "error",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-shadow": ["error", { builtinGlobals: false, hoist: "all", allow: [] }],
      "@typescript-eslint/no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
      "@typescript-eslint/no-var-requires": "off",
      "curly": ["error", "multi-line", "consistent"],
      "dot-notation": "error",
      "eol-last": "warn",
      "eqeqeq": ["error", "smart"],
      "@eslint-community/eslint-comments/no-unused-disable": "warn",
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
      "radix": "error",
      "semi": ["error", "always"]
    }
  },
);
