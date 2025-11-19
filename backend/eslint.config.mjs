import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		ignores: ['node_modules/**', 'uploads/**'],
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'commonjs',
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		extends: [js.configs.recommended],
		rules: {
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'no-console': 'off',
		},
	},
]);
