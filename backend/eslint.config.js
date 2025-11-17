import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist", "node_modules", "*.config.js"]
    },
    {
        files: ["**/*.ts"],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
            prettierConfig
        ],
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                ...globals.node,
                ...globals.es2022
            },
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname
            }
        },
        plugins: {
            prettier
        },
        rules: {
            // Prettier
            "prettier/prettier": "warn",

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
            "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
            "@typescript-eslint/no-confusing-void-expression": "off",

            // General best practices
            "no-console": "off", // Allow console in backend
            "no-debugger": "error",
            eqeqeq: ["error", "always"],
            "no-var": "error",
            "prefer-const": "error",
            "prefer-arrow-callback": "error",
            "no-param-reassign": "error",
            "no-throw-literal": "error",

            // Code style preferences
            "comma-dangle": ["error", "never"],
            "arrow-body-style": ["error", "as-needed"],
            "no-restricted-syntax": [
                "error",
                {
                    selector: "TryStatement",
                    message: "Use @jfdi/attempt instead of try/catch"
                }
            ]
        }
    }
);
