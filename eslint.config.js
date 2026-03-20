import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import tailwindPlugin from 'eslint-plugin-tailwindcss'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ── 公共 import 规则配置（scripts/ 和 src/ 共用）──
const importOrderRules = {
  'import/no-duplicates': 'error',
  'import/order': [
    'warn',
    {
      groups: [
        'builtin', // Node.js 内置模块
        'external', // 外部依赖（node_modules）
        'internal', // 内部路径别名（@/...）
        'parent', // 父级路径（../）
        'sibling', // 同级路径（./）
        'index', // 索引文件
        'type', // 类型导入
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
    },
  ],
}

export default defineConfig([
  // 忽略构建产物和第三方目录
  globalIgnores(['dist', 'node_modules', 'kubition-advanture', 'output']),

  // ── Node.js 配置文件环境（vite.config.ts 等）──
  {
    files: ['*.config.{js,ts,mjs,cjs}', 'vite.config.*'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },

  // ── Node.js 脚本环境（scripts/ 目录）──
  {
    files: ['scripts/**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    plugins: {
      prettier: prettierPlugin,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'prettier/prettier': 'warn',
      ...importOrderRules,
    },
  },

  // ── 测试文件环境（vitest 全局变量）──
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/test/**/*.ts'],
    languageOptions: {
      globals: {
        // Vitest 全局变量
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        suite: 'readonly',
      },
    },
  },

  // ── 主体：TypeScript + React 源码 ──
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react: reactPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      prettier: prettierPlugin,
      tailwindcss: tailwindPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      // eslint-plugin-react 自动检测 React 版本
      react: {
        version: 'detect',
      },
      // eslint-plugin-import 解析器设置
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      // eslint-plugin-tailwindcss：指定 Tailwind CSS v4 的 CSS 入口文件
      tailwindcss: {
        // v4 不再使用 tailwind.config.js，设为空对象以抑制路径解析警告
        config: {},
        cssFiles: ['src/assets/styles/index.css'],
      },
    },
    rules: {
      // ── React 规则 ──
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-unknown-property': 'error',
      'react/self-closing-comp': 'warn',
      // React 17+ 新 JSX 转换，无需手动引入 React
      'react/react-in-jsx-scope': 'off',

      // ── Import 规则 ──
      ...importOrderRules,
      'import/no-unused-modules': 'warn',

      // ── 无障碍访问（a11y）规则 ──
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',

      // ── Prettier 格式化（作为 ESLint 规则运行）──
      'prettier/prettier': 'warn',

      // ── Tailwind CSS 规则 ──
      // beta 版对 v4 的支持，no-contradicting-classname 存在已知误报，暂时关闭
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          skipClassAttribute: true,
          callees: ['clsx'],
        },
      ],
      'tailwindcss/no-contradicting-classname': 'off',
    },
  },

  // ── 禁用与 Prettier 冲突的 ESLint 格式化规则（必须放在最后）──
  prettierConfig,
])
