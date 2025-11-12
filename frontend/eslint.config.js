import js from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist", "node_modules", "*.config.js", "*.config.ts"] },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
            parserOptions: {
                project: ["./tsconfig.app.json", "./tsconfig.node.json"],
                tsconfigRootDir: import.meta.dirname,
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        plugins: {
            react: react,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh
        },
        settings: {
            react: {
                version: "detect"
            }
        },
        rules: {
            // React
            ...react.configs.recommended.rules,
            ...react.configs["jsx-runtime"].rules,

            // React Hooks
            ...reactHooks.configs.recommended.rules,

            // React Refresh
            "react-refresh/only-export-components": ["error", { allowConstantExport: true }],

            // TypeScript strict rules
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/explicit-function-return-type": [
                "error",
                {
                    allowExpressions: true,
                    allowTypedFunctionExpressions: true,
                    allowHigherOrderFunctions: true
                }
            ],
            "@typescript-eslint/strict-boolean-expressions": [
                "error",
                {
                    allowString: false,
                    allowNumber: false,
                    allowNullableObject: false
                }
            ],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-misused-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-unnecessary-condition": "error",
            "@typescript-eslint/prefer-nullish-coalescing": "error",
            "@typescript-eslint/prefer-optional-chain": "error",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",

            // General best practices
            "no-console": ["warn", { allow: ["warn", "error", "log"] }],
            "no-debugger": "error",
            "no-alert": "error",
            eqeqeq: ["error", "always"],
            "no-var": "error",
            "prefer-const": "error",
            "prefer-arrow-callback": "error",
            "no-param-reassign": "error",

            // Code quality enforcement
            "max-lines": ["error", { max: 200, skipBlankLines: true, skipComments: true }],

            // No try/catch - use @jfdi/attempt
            // No let - use const and recursion/map/reduce
            // No for loops - use functional patterns
            "no-restricted-syntax": [
                "error",
                {
                    selector: "TryStatement",
                    message: "Use @jfdi/attempt instead of try/catch"
                },
                {
                    selector: 'VariableDeclaration[kind="let"]',
                    message:
                        "Use const instead of let. Use recursion or functional patterns instead of mutation."
                },
                {
                    selector: "ForStatement",
                    message: "Use map/filter/reduce/forEach or recursion instead of for loops"
                },
                {
                    selector: "ForInStatement",
                    message: "Use Object.keys/values/entries with forEach instead of for...in"
                },
                {
                    selector: "ForOfStatement",
                    message: "Use forEach/map/filter/reduce instead of for...of"
                },
                {
                    selector: "WhileStatement",
                    message: "Use recursion instead of while loops"
                },
                {
                    selector: "DoWhileStatement",
                    message: "Use recursion instead of do...while loops"
                }
            ]
        }
    },
    prettierRecommended,
    // Add this config object to override Prettier severity
    {
        rules: {
            "prettier/prettier": "warn"
        }
    }
);
