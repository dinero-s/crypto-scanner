import eslintConfigPrettier from 'eslint-config-prettier';
import tsEslint from 'typescript-eslint';

const tsconfigRootDir = new URL('.', import.meta.url).pathname;

const rules = tsEslint.configs.recommended
    .map(config => config.rules)
    .filter(rules => rules !== undefined)
    .reduce((a, b) => ({ ...b, ...a }), {});

export default [
    eslintConfigPrettier,
    {
        ignores: [
            '.github/*',
            '.husky/*',
            'coverage/*',
            'data/*',
            'dist/*',
            'docs/*',
            'logs/*',
            'node_modules/*',
        ],
    },
    {
        name: 'ts/default',
        files: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: tsEslint.parser,
            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir,
            },
        },
        linterOptions: {
            noInlineConfig: true,
            reportUnusedDisableDirectives: true,
        },
        plugins: {
            '@typescript-eslint': tsEslint.plugin,
        },
        rules: {
            ...rules,
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
];
