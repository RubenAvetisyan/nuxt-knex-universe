
<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: nuxt-knex-universe
- Package name: nuxt-knex-universe
- Description: Embrace the power of versatile database connectivity with nuxt-knex-universe, the ultimate module for Nuxt 3 developers seeking robust SQL solutions.
-->

# nuxt-knex-universe

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Embrace the power of versatile database connectivity with nuxt-knex-universe, the ultimate module for Nuxt 3 developers seeking robust SQL solutions.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/nuxt-knex-universe?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

- **Broad Database Support**: Connect seamlessly with PostgreSQL, MSSQL, MySQL, MariaDB, SQLite3, and more.
- **Flexible & Portable**: Designed for a variety of SQL environments, ensuring ease of use and adaptability.
- **Multiple Database Handling**: Manage connections to multiple databases simultaneously.
- **Nuxt 3 Integration**: Optimized for use with the Nuxt 3 framework.

## Quick Setup

1. Add `nuxt-knex-universe` dependency to your project

```bash
# Using pnpm
pnpm add -D nuxt-knex-universe

# Using yarn
yarn add --dev nuxt-knex-universe

# Using npm
npm install --save-dev nuxt-knex-universe
```

2. Add `nuxt-knex-universe` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: [
    'nuxt-knex-universe'
  ]
})
```

That's it! You can now use nuxt-knex-universe in your Nuxt app ✨

## Development

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Run Vitest
npm run test
npm run test:watch

# Release new version
npm run release
```

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-knex-universe/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-knex-universe

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-knex-universe.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-knex-universe

[license-src]: https://img.shields.io/npm/l/nuxt-knex-universe.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-knex-universe

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
