import typescriptEslint from "typescript-eslint";

export default [
    {
        ignores: [
            "**/dist/*",
            "**/result/*",
            "**/node_modules/*"
        ]
    },
    ...typescriptEslint.configs.strict,
    {
        rules: {
            "quotes": ["error", "double"],
            "semi": ["error", "always"],
            "comma-dangle": ["error", "never"],

            // TODO: find a rule to make it so that relative imports are needed
            // this is because those pass type checking, and fails at runtime
            // not very typescript

            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    varsIgnorePattern: "^_",
                    argsIgnorePattern: "^_"
                }
            ]
        }
    }
];
