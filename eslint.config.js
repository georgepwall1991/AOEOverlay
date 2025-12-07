import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src-tauri/**",
      "*.config.js",
      "*.config.ts",
      "coverage/**",
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules (includes parser setup)
  ...tseslint.configs.recommended,

  // Main source files
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        React: "readonly",
        JSX: "readonly",
        RequestInfo: "readonly",
        RequestInit: "readonly",
        FrameRequestCallback: "readonly",
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,

      // React Refresh
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "badgeVariants",
            "buttonVariants",
            "GAME_ICONS",
            "renderIconText",
            "ONBOARDING_KEY",
            "resetOnboarding",
          ],
        },
      ],

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",

      // Disable base rules that conflict with TS
      "no-unused-vars": "off",
      "no-undef": "off",

      // React hooks - setState in effect is valid for animations with cleanup
      "react-hooks/set-state-in-effect": "off",

      // React - not needed with new JSX transform
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // Code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-template-curly-in-string": "warn",
      "prefer-const": "error",
      "no-var": "error",

      // Disable overly strict rules
      "react/no-unescaped-entities": "off", // Quotes/apostrophes in JSX are fine
      "no-duplicate-imports": "off", // TypeScript handles this better with type imports
    },
  },

  // Test files - more relaxed rules
  {
    files: ["src/**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        React: "readonly",
        JSX: "readonly",
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        test: "readonly",
        global: "readonly",
      },
    },
    rules: {
      // Relax rules for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "react-refresh/only-export-components": "off",
      "no-console": "off",
    },
  }
);
