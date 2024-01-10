import { logger } from '@nuxt/kit'
import knex, { Knex } from 'knex'
import defu from 'defu'
import { Pool } from './pool-class'
import { cronManager } from './cron-class'

import type { CronManager, Interval } from './cron-class'

type KnexPoolOptions = {
    restart?: Interval
}

/**
 * The client property specifies the type of database client to be used for the connection.
 * Possible values:
 *   - 'pg' for PostgreSQL (https://github.com/brianc/node-postgres),
 *   - 'pg-native' for PostgreSQL with native C++ libpq bindings (requires PostgresSQL installed to link against. Check https://github.com/brianc/node-pg-native),
 *   - 'mysql' for MySQL or MariaDB (https://github.com/mysqljs/mysql),
 *   - 'sqlite3' for SQLite3 (https://github.com/TryGhost/node-sqlite3),
 *   - 'tedious' for MSSQL (https://github.com/tediousjs/tedious).
 */
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


type MySQLandPgPollConfig = { pool: { min: number; max: number; }; }
/**
 * The Connection interface contains the details for connecting to the database, including the host, port, username, password, and database name.
 */
export interface Connection {
    /**
     * The host of the database server.
     */
    host: string;

    /**
     * The port of the database server.
     */
    port: string;

    /**
     * The username for authenticating with the database server.
     */
    user: string;

    /**
     * The password for authenticating with the database server.
     */
    password: string;

    /**
     * The name of the database.
     */
    database: string;
    pool?: MySQLandPgPollConfig
}

export type DbConfig = {
    client: Client
    connection: Connection
}
export type ExactConnection<T extends DbConfig> = T['connection']
export type DbName<T extends DbConfig> = ExactConnection<T>['database']

export type RT<O extends DbConfig, T extends (P: O) => any> = ReturnType<T>

type KnexConnectionOptions = {
    pool: KnexPoolOptions
}

type ExtendedConfig<T extends DbConfig> = T & { pool: MySQLandPgPollConfig } | T

export class KnexConnection<T extends DbConfig>{
    private config: ExtendedConfig<T>
    private pools: Map<DbName<DbConfig>, Pool> = new Map()

    constructor(config: T, public options?: KnexConnectionOptions) {
        this.config = ['mysql', 'pg'].includes(config.client)
            ? { ...config, pool: { min: 0, max: 7 } }
            : config;
        this.init()
    }

    init() {
        this.createPool()
    }

    get client() {
        return this.config.client
    }

    get connectionOptions() {
        return this.config.connection
    }

    get dbName() {
        return this.config.connection.database
    }

    onTick(dbName: DbName<T>) {
        logger.info(`Перезапуск пула ${dbName}`)
        this.restartPool(dbName)
    }

    setJob(dbName: DbName<T>, interval: Interval) {
        cronManager.scheduleJob(`${dbName}-pool-restart`, {
            interval,
            onTick: () => this.onTick(dbName),
        })
    }

    createPool(options?: KnexPoolOptions) {
        const connection = knex(this.config)
        const thisPool = new Pool(connection)
        this.pools.set(this.dbName, thisPool)

        if (options?.restart && 'unit' in options.restart && 'value' in options.restart) {
            this.setJob(this.dbName, options.restart)
        }

        return thisPool.pool
    }

    poolExists(dbName: DbName<T>) {
        console.log('dbName: ', dbName);
        return this.pools.has(dbName)
    }

    public getPool(dbName: DbName<T>): Knex {
        console.log('this.poolExists(dbName): ', this.poolExists(dbName));
        if (!this.poolExists(dbName)) {
            this.createPool(this.options?.pool)
        }

        return this.pools.get(dbName)?.pool.connection!
    }

    private async restartPool(dbName: DbName<T>): Promise<void> {
        try {
            const pool = this.getPool(dbName)
            if (pool) {
                await pool.destroy()
                this.pools.delete(dbName)
                this.createPool(this.options?.pool)
            }
        } catch (error) {
            logger.warn(`Ошибка при перезапуске пула ${dbName}:`, error)
        }
    }

    /**
     * Restarts all the pools.
     *
     * @return {Promise<void>} The promise that resolves when all the pools are restarted.
     */
    private async restartAllPools(): Promise<void> {
        try {
            for (const thisPool of this.pools.values()) {
                await thisPool.pool.connection.destroy()
            }
            this.pools.clear()
            this.createPool(this.options?.pool)
        } catch (error) {
            logger.warn('Ошибка при перезапуске пулов:')
            logger.error(error)
            // Запланировать повторный перезапуск через 5 минут
            setTimeout(() => this.restartAllPools(), 5 * 60 * 1000)
        }
    }

    public async executeQuery<Q>(
        query: string,
        parameters: any[] = [],
    ): Promise<Q[]> {
        const connection = this.getPool(this.dbName)
        try {
            // Установка group_concat_max_len перед основным запросом
            await connection.raw('SET SESSION group_concat_max_len = 5000000')

            const [result = []] = await connection.raw(query, parameters)
            return result
        } catch (error) {
            logger.warn(`Ошибка при выполнении запроса: ${query}`, error)
            throw error
        }
    }
}