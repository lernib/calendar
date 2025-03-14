import { defineConfig } from 'vitest/config';
import tsconfig from './tsconfig.json';
import path from 'path';

// Create an alias object from the paths in tsconfig.json
//
// thanks a bunch Chris, https://christophervachon.com/blog/2024-04-15-vitest-typescript-paths/
// - Carlos
const alias = Object.fromEntries(
	// For Each Path in tsconfig.json
	Object.entries(tsconfig.compilerOptions.paths).map(([key, [value]]) => [
		// Remove the "/*" from the key and resolve the path
		key.replace('/*', ''),
		// Remove the "/*" from the value Resolve the relative path
		path.resolve(__dirname, value.replace('/*', ''))
	])
);

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts']
	},
	resolve: { alias }
});
