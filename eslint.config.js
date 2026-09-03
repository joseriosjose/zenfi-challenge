import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      // Habilita reglas con información de tipos (no-unnecessary-type-assertion).
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- "TypeScript de verdad, no `any` decorativo" -------------------
      // La mitad verificable de la regla vive aquí para que no dependa de
      // que alguien la recuerde. La mitad de criterio vive en CLAUDE.md.
      '@typescript-eslint/no-explicit-any': 'error',
      // Prohíbe `as X` por completo. `as const` sigue permitido: es una
      // aserción de constante, no de tipo. Para el parseo de datos crudos
      // usa type guards; si uno necesita un `as` interno, va con un
      // comentario de desactivacion puntual y el motivo escrito.
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // Nada de `!` para tapar un `undefined` posible: chequéalo o modélalo.
      '@typescript-eslint/no-non-null-assertion': 'error',
      // `@ts-expect-error` solo con una explicación de verdad.
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 10 },
      ],
    },
  },
]);
