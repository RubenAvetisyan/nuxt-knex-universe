import type { Nuxt } from 'nuxt/schema'
import type { WebSocketServer } from 'vite'
import { z } from 'zod'

const mySQLOrSqlitePoolSchema = z.object({
    min: z.number().min(0).default(0),
    max: z.number().min(0).default(7)
}).describe('The connection pool configuration. has min and max properties')

export const sqlite3ConnectionSchema = z.object({
    client: z.literal('sqlite3'),
    connection: z.object({
        filename: z.union([
            z.literal(':memory:'),
            z.literal('file:memDb1?mode=memory&cache=shared'),
            z.string().refine(val => RegExp(/^.*(\/\w+)\.sqlite$/gim).test(val), { message: 'Invalid filename' })
        ]),
        flags: z.array(z.union([z.literal('OPEN_URI'), z.literal('OPEN_SHAREDCACHE')])).optional()
    }).strict(),
    useNullAsDefault: z.boolean().optional().default(true),
    pool: mySQLOrSqlitePoolSchema.optional()
}).refine((value) => typeof value === 'object', { message: 'Invalid sqlite3 connection' })
    .describe('SQLite3 (https://github.com/TryGhost/node-sqlite3)');

export const mySqlConnectionSchema = z.object({
    client: z.literal('mysql'),
    connection: z.object({
        host: z.union([
            z.string().ip().refine(value => value.length > 0, { message: 'Host is required' }),
            z.literal('localhost')
        ]).describe('The host of the database server.'),
        port: z.union([
            z.number().min(2).default(3306),
            z.string().min(2).transform(value => parseInt(value))
        ]).describe('The port of the database server.'),
        user: z.string().describe('The username for authenticating with the database server.'),
        password: z.string().describe('The password for authenticating with the database server.'),
        database: z.string().min(1, { message: 'Database name is required' }).describe('The name of the database.'),
    }).strict().describe('The connection details of the database server.'),
    useNullAsDefault: z.boolean().optional().default(true),
    pool: mySQLOrSqlitePoolSchema.optional()
}).refine((value) => typeof value === 'object', { message: 'Invalid mysql connection' })
    .describe('MySQL or MariaDB (https://github.com/mysqljs/mysql)');

// Add other connection schemas as needed

// Union of different connection configurations
export const ConnectionConfigSchema = z.union([
    sqlite3ConnectionSchema,
    mySqlConnectionSchema,
    // Add other connection schemas here
]);

export const ModuleOptionsSchema = z.object({
    configs: z.array(ConnectionConfigSchema).refine((value) => Array.isArray(value), { message: 'Invalid connection' }),
}).strict().describe(`The client property specifies the type of database client to be used for the connection.
Possible values:
  - 'pg' for PostgreSQL (https://github.com/brianc/node-postgres),
  - 'pg-native' for PostgreSQL with native C++ libpq bindings (requires PostgresSQL installed to link against. Check https://github.com/brianc/node-pg-native),
  - 'mysql' for MySQL or MariaDB (https://github.com/mysqljs/mysql),
  - 'sqlite3' for SQLite3 (https://github.com/TryGhost/node-sqlite3),
  - 'tedious' for MSSQL (https://github.com/tediousjs/tedious).`);

export type Client =
    | 'mssql'
    | 'mysql'
    | 'mysql2'
    | 'oracledb'
    | 'pg'
    | 'postgres'
    | 'postgresql'
    | 'pgnative'
    | 'redshift'
    | 'sqlite'
    | 'sqlite3'
    | 'cockroachdb'
    | 'better-sqlite3'

/**
 * The client property specifies the type of database client to be used for the connection.
 * Possible values:
 *   - 'pg' for PostgreSQL (https://github.com/brianc/node-postgres),
 *   - 'pg-native' for PostgreSQL with native C++ libpq bindings (requires PostgresSQL installed to link against. Check https://github.com/brianc/node-pg-native),
 *   - 'mysql' for MySQL or MariaDB (https://github.com/mysqljs/mysql),
 *   - 'sqlite3' for SQLite3 (https://github.com/TryGhost/node-sqlite3),
 *   - 'tedious' for MSSQL (https://github.com/tediousjs/tedious).
 */
export type ModuleOptions = z.infer<typeof ModuleOptionsSchema>

export interface DevtoolsServerContext {
    nuxt: Nuxt
    options: ModuleOptions
    wsServer: Promise<WebSocketServer>
}