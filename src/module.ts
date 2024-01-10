import { fileURLToPath } from 'node:url';
import {
  defineNuxtModule,
  createResolver,
  addServerPlugin,
  // addServerImports,
  // addServerScanDir,
  // addServerImportsDir,
  logger,
  addTemplate
} from '@nuxt/kit'
import { z } from 'zod'
import defu from 'defu'
import { version } from '../package.json'
// import { databases } from './knex/connection-class'

// const ClientSchema = z.enum([
//   'mssql', 'mysql', 'mysql2', 'oracledb', 'pg', 'postgres', 'postgresql',
//   'pgnative', 'redshift', 'sqlite', 'sqlite3', 'cockroachdb', 'better-sqlite3'
// ]);

const sqliteConnectionSchema = z.object({
  client: z.literal('sqlite3'),
  connection: z.object({
    filename: z.string().refine(value => value.length > 0, { message: 'Filename is required' }),
    flags: z.union([z.literal('OPEN_URI'), z.literal('OPEN_SHAREDCACHE')]).optional()
  }).strict()
}).refine((value) => typeof value === 'object', { message: 'Invalid sqlite3 connection' });

const mySqlConnectionSchema = z.object({
  client: z.literal('mysql'),
  connection: z.object({
    host: z.union([
      z.string().ip().refine(value => value.length > 0, { message: 'Host is required' }),
      z.literal('localhost')
    ]),
    port: z.string().default('3306'),
    user: z.string(),
    password: z.string(),
    database: z.string().refine(value => value.length > 0, { message: 'Database name is required' }),
  }).strict()
}).refine((value) => typeof value === 'object', { message: 'Invalid mysql connection' });

// Add other connection schemas as needed

// Union of different connection configurations
const ConnectionConfigSchema = z.union([
  sqliteConnectionSchema.refine((value) => value.client === 'sqlite3' && value.connection.filename.length > 0, { message: 'Filename is required' }),
  mySqlConnectionSchema,
  // Add other connection schemas here
]);

const ModuleOptionsSchema = z.object({
  configs: z.array(ConnectionConfigSchema).refine((value) => Array.isArray(value), { message: 'Invalid connection' }),
}).strict();


const noConfigsMessage = `This error message is indicating that the "knex config" variable is not defined. 
To fix this, you need to use the "knexConnections" object and provide the connection configurations.
The "knexConnections" object should have a property called "config" that is an array of connection configurations.
Each connection configuration should be an object containing the necessary information for establishing a database connection.
You can have multiple connection options in the "config" array to make multiple database connections.`

/**
 * Module options TypeScript interface definition.
 */
export type ModuleOptions = z.infer<typeof ModuleOptionsSchema>

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-knex-universe',
    configKey: 'knexConnections',
    // Compatibility constraints
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '>=3.5.0'
    },
    version
  },
  // Default configuration options of the Nuxt module
  defaults: {
    configs: [{
      client: 'mysql',
      connection: {
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: 'password',
        database: 'database'
      }
    }]
  },
  async setup(options, nuxt) {
    try {
      // if (nuxt.options.dev) {
      //   $fetch('https://registry.npmjs.org/nuxt-mongoose/latest').then((release: any) => {
      //     if (release.version > version)
      //       logger.info(`A new version of Nuxt Knex Universe (v${release.version}) is available: https://github.com/arashsheyda/nuxt-mongoose/releases/latest`)
      //   }).catch(() => { })
      // }

      const { resolve } = createResolver(import.meta.url)

      const safeOption = ModuleOptionsSchema.safeParse(options)


      if (!safeOption.success) throw new Error(`validation error: ${safeOption.error}`)

      const configs = safeOption?.data.configs

      if (!configs) {
        logger.fatal(noConfigsMessage)
        throw new Error("'knexConnections.configs' is not defined")
      }

      configs.forEach((c) => {
        if (c.client === 'sqlite3' && c.connection.filename) {
          c.connection.filename = resolve(c.connection.filename)
        }
      })

      // merge configs
      const config = nuxt.options.runtimeConfig as any
      config.knexConnections = defu(config.knexConnections?.configs || {}, { configs })

      // virtual imports
      nuxt.hook('nitro:config', (_config) => {
        _config.alias = _config.alias || {}

        // Inline module runtime in Nitro bundle
        _config.externals = defu(typeof _config.externals === 'object' ? _config.externals : {}, {
          inline: [resolve('./runtime')],
        })
        _config.alias['#nuxt/knex-universe'] = resolve('./runtime/server/services')

        if (_config.imports) {
          _config.imports.dirs = _config.imports.dirs || []

          if ('knexConnections' in _config) {
            _config.imports.dirs?.push(config.knexConnections.connection.filename)
          } else {
            _config = defu(_config, {
              knexConnections: safeOption?.data
            })
          }
          // _config.imports.dirs?.push(config.knexConnections.modelsDir)
        }
      })

      addTemplate({
        filename: 'types/knex-universe.d.ts',
        getContents: () => [
          'declare module \'#nuxt/knex-universe\' {',
          `  const defineKnexConnection: typeof import('${resolve('./runtime/server/services')}').defineKnexConnection`,
          `  const databases: typeof import('${resolve('./runtime/server/services')}').defineMongooseModel()`,
          '}',
        ].join('\n'),
      })

      nuxt.hook('prepare:types', (options) => {
        options.references.push({ path: resolve(nuxt.options.buildDir, 'types/knex-universe.d.ts') })
      })

      const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

      // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
      nuxt.options.build.transpile.push(runtimeDir)
      addServerPlugin(resolve('./runtime/server/plugins/module.db'))
      // addServerScanDir(resolve('./runtime/server'))

      // addServerImportsDir([
      //   resolve('./runtime/server/utils')
      // ])

      logger.success('`nuxt-knex-universe` is ready!')
    } catch (error: any) {
      logger.error(error.message)
      await nuxt.close()
    }
  }
})
