import { fileURLToPath } from 'node:url';
import { defineNuxtModule, addPlugin, createResolver, installModule } from '@nuxt/kit'
import { z } from 'zod'
import { log } from './runtime/messageOut'
import { KnexConnection } from './utils/connection-class'

const ClientSchema = z.enum(['pg', 'pg-native', 'mysql', 'sqlite3', 'tedious'])
const ConnectionSchema = z.object({
  host: z.string(),
  port: z.string(),
  user: z.string(),
  password: z.string(),
  database: z.string(),
})

const ModuleOptionsSchema = z.array(z.object({
  client: ClientSchema,
  connection: ConnectionSchema,
}))

const noConfigsMessage = `This error message is indicating that the "knex config" variable is not defined. 
To fix this, you need to use the "knexConnections" object and provide the connection configurations.
The "knexConnections" object should have a property called "config" that is an array of connection configurations.
Each connection configuration should be an object containing the necessary information for establishing a database connection.
You can have multiple connection options in the "config" array to make multiple database connections.`

export type ModuleOptions = {
  configs: z.infer<typeof ModuleOptionsSchema> | null
}

/**
 * Module options TypeScript interface definition.
 */
// export interface ModuleOptions {
//   /**
//    * The client property specifies the type of database client to be used for the connection.
//    * Possible values:
//    *   - 'pg' for PostgreSQL (https://github.com/brianc/node-postgres),
//    *   - 'pg-native' for PostgreSQL with native C++ libpq bindings (requires PostgresSQL installed to link against. Check https://github.com/brianc/node-pg-native),
//    *   - 'mysql' for MySQL or MariaDB (https://github.com/mysqljs/mysql),
//    *   - 'sqlite3' for SQLite3 (https://github.com/TryGhost/node-sqlite3),
//    *   - 'tedious' for MSSQL (https://github.com/tediousjs/tedious).
//    */
//   client: 'pg' | 'pg-native' | 'mysql' | 'sqlite3' | 'tedious';

//   /**
//    * The connection property contains the details for connecting to the database, including the host, port, username, password, and database name.
//    */
//   connection: {
//     /**
//      * The host of the database server.
//      */
//     host: string;

//     /**
//      * The port number of the database server.
//      */
//     port: string;

//     /**
//      * The username for authentication.
//      */
//     user: string;

//     /**
//      * The password for authentication.
//      */
//     password: string;

//     /**
//      * The name of the database.
//      */
//     database: string;
//   };
// }[]

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-knex-universe',
    configKey: 'knexConnections',
    // Compatibility constraints
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '>=3.5.0'
    }
  },
  // Default configuration options of the Nuxt module
  defaults: {
    configs: [{
      client: 'mysql',
      connection: {
        host: '10.120.2.34',
        port: '3306',
        user: process.env.NUXT_DB_LOGIN || 'analitic_portal',
        password: process.env.NUXT_DB_PASSWORD || 'Amaelethood8daum',
        database: 'billing',
      }
    }]
  },
  hooks: {
    "listen": (ls, l) => {
      console.log('l: ', l);
      console.log('ls: ', ls)
    }
  },
  async setup(options, nuxt) {
    try {
      if (!options.configs) {
        log.error(noConfigsMessage)
        await nuxt.close()
        throw new Error("'knexConnections.configs' is not defined")
      }

      if (!nuxt.options.modules.includes('@nuxtjs/eslint-module')) {
        await installModule('@nuxtjs/eslint-module', {
          eslint: {
            cache: true,
            include: [`${nuxt.options.srcDir}/**/*.{js,jsx,ts,tsx,vue}`],
            exclude: ['**/node_modules/**', nuxt.options.buildDir],
            eslintPath: 'eslint',
            formatter: 'stylish',
            lintOnStart: true,
            emitWarning: true,
            emitError: true,
            failOnWarning: false,
            failOnError: false
          }
        }, nuxt)
      }

      const setKey = (text: string, index: any) => {
        return `${text}-${index}`
      }

      const connectionOptions = ModuleOptionsSchema.safeParse(options)
      // const keys = options.configs.map(({ connection }, i) => setKey(connection.database, i))
      nuxt.hook('listen', () => {
        if (connectionOptions.success) {
          const dbs = new KnexConnection(connectionOptions.data)
        }
      })

      const resolver = createResolver(import.meta.url)
      const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

      // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
      nuxt.options.build.transpile.push(runtimeDir)
      addPlugin({
        src: resolver.resolve('./runtime/plugin'),
        mode: 'server',
      })
    } catch (error: any) {
      log.error(error.message)
    }
  }
})
