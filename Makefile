# Makefile for Crust File Browser

.PHONY: install dev build lint lint-fix type-check test clean all

# Default target
all: install lint type-check build

# Install dependencies
install:
	pnpm install

# Development server
dev:
	pnpm dev

# Production build
build:
	pnpm build

# Lint code
lint:
	pnpm eslint . --ext .js,.jsx --max-warnings 0

# Fix lint issues automatically
lint-fix:
	pnpm eslint . --ext .js,.jsx --fix

# Type checking
type-check:
	pnpm tsc --noEmit

# Run tests
test:
	pnpm vitest run

# Clean build artifacts and dependencies
clean:
	rm -rf node_modules
	rm -rf dist
	rm -rf .eslintcache
	rm -rf coverage

# Setup the project with all necessary configurations
setup:
	@echo "Setting up project..."
	pnpm add -D eslint \
		@typescript-eslint/parser \
		@typescript-eslint/eslint-plugin \
		eslint-plugin-react \
		eslint-plugin-react-hooks \
		eslint-plugin-jsx-a11y \
		typescript \
		@types/react \
		@types/react-dom \
		vitest \
		@testing-library/react \
		@testing-library/jest-dom \
		@vitejs/plugin-react
	@echo "Creating ESLint config..."
	@echo '{\n\
		"extends": [\n\
			"eslint:recommended",\n\
			"plugin:react/recommended",\n\
			"plugin:react-hooks/recommended",\n\
			"plugin:jsx-a11y/recommended"\n\
		],\n\
		"parser": "@typescript-eslint/parser",\n\
		"plugins": [\n\
			"react",\n\
			"react-hooks",\n\
			"jsx-a11y"\n\
		],\n\
		"rules": {\n\
			"react/react-in-jsx-scope": "off",\n\
			"react/prop-types": "off"\n\
		},\n\
		"settings": {\n\
			"react": {\n\
				"version": "detect"\n\
			}\n\
		},\n\
		"env": {\n\
			"browser": true,\n\
			"es2021": true,\n\
			"node": true\n\
		}\n\
	}' > .eslintrc.json
	@echo "Creating TypeScript config..."
	@echo '{\n\
		"compilerOptions": {\n\
			"target": "ESNext",\n\
			"lib": ["DOM", "DOM.Iterable", "ESNext"],\n\
			"allowJs": true,\n\
			"skipLibCheck": true,\n\
			"esModuleInterop": true,\n\
			"allowSyntheticDefaultImports": true,\n\
			"strict": true,\n\
			"forceConsistentCasingInFileNames": true,\n\
			"module": "ESNext",\n\
			"moduleResolution": "Node",\n\
			"resolveJsonModule": true,\n\
			"isolatedModules": true,\n\
			"noEmit": true,\n\
			"jsx": "react-jsx",\n\
			"baseUrl": ".",\n\
			"paths": {\n\
				"@/*": ["src/*"]\n\
			}\n\
		},\n\
		"include": ["src"],\n\
		"references": [{ "path": "./tsconfig.node.json" }]\n\
	}' > tsconfig.json
	@echo "Creating Vitest config..."
	@echo 'import { defineConfig } from "vite";\n\
	import react from "@vitejs/plugin-react";\n\
	\n\
	export default defineConfig({\n\
		plugins: [react()],\n\
		test: {\n\
			globals: true,\n\
			environment: "jsdom",\n\
			setupFiles: "./src/test/setup.ts",\n\
		},\n\
	});' > vitest.config.ts
	@mkdir -p src/test
	@echo 'import "@testing-library/jest-dom";\n' > src/test/setup.ts
	@echo "Setup complete!"

# Watch mode for development
watch:
	pnpm vitest