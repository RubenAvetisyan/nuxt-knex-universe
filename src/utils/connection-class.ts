import { z } from 'zod'
import { CronJob } from 'cron'
import pkg from 'knex'
import { Knex } from 'knex';
import SchemaInspector from 'knex-schema-inspector'
import CronJobManager from './cron-class'

// @ts-ignore
const knex = pkg

const ClientSchema = z.enum(['pg', 'pg-native', 'mysql', 'sqlite3', 'tedious'])
const ConnectionSchema = z.object({
    host: z.string(),
    port: z.string(),
    user: z.string(),
    password: z.string(),
    database: z.string(),
})

const KnexConfiurationSchema = z.object({
    client: ClientSchema,
    connection: ConnectionSchema,
})

const ConnectionsSchema = z.array(KnexConfiurationSchema)

const knexValidator = z.custom((val): val is Knex => {
    // Your validation logic here
    // For example, check if val is a function (since Knex instances are functions)
    return typeof val === 'function';
})

const schemaInspectorValidator = z.custom((val): val is ReturnType<typeof SchemaInspector> => {
    // Implement your validation logic here
    // For example, check if the object has expected properties or methods
    return typeof val === 'object' && val !== null; // Add more specific checks as needed
})

const PoolSchema = z.object({
    connection: knexValidator,
    inspector: schemaInspectorValidator,
    cronJob: z.instanceof(CronJob),
})

const PoolsSchema = z.map(z.string(), PoolSchema)

type KnexConfiguration = z.infer<(typeof KnexConfiurationSchema)>

export class KnexConnection {
    private cronJob: CronJobManager
    private readonly connectionOtions: Map<KnexConfiguration['connection']['database'], KnexConfiguration> = new Map()
    // private connectionOtions: any
    private pools: z.infer<typeof PoolsSchema>

    constructor(connectionOtions: z.infer<typeof ConnectionsSchema>) {
        this.pools = new Map()
        this.cronJob = new CronJobManager()

        this.init(connectionOtions)
    }

    private init(connectionOtions: z.infer<typeof ConnectionsSchema>) {
        for (const connection of connectionOtions) {
            this.connectionOtions.set(connection.connection.database, connection)            
        }
    }

    setCronJobs(dbName: string) {
        if (!dbName) throw new Error('dbName is not defined')

        if (!this.connectionOtions.has(dbName)) {
            throw new Error(`Connection ${dbName} not found`)
        }

        return this.cronJob.scheduleJob(`${dbName}-pool-restart`, {
            interval: {
                value: 3,
                unit: 'hours',
            },
            onTick: () => {
                console.log(`Перезапуск пула ${dbName}`)
                this.restartPool(dbName)
            },
        })
    }

    private createPool(dbName: string): Knex {
        if (this.pools.has(dbName)) {
            throw new Error(`Pool ${dbName} already exists`)
        }
        
        const connection = this.connectionOtions.get(dbName)!
        const pool = PoolSchema.parse(knex(connection))
        const inspector = SchemaInspector(knex(connection))
        const cronJob = this.setCronJobs(dbName)

        this.pools.set(dbName, {
            connection: pool,
            inspector,
            cronJob,
        })

        return this.getPool(dbName)
    }

    public getInspector(dbName: string) {
        const poolEntry = this.pools.get(dbName);
        if (!poolEntry) {
            throw new Error(`Inspector not found for dbName: ${dbName}`);
        }
        // Use type assertion for `inspector`
        return poolEntry.inspector as ReturnType<typeof SchemaInspector>;
    }

    public getPool(dbName: string): Knex {
        const poolEntry = this.pools.get(dbName);
        if (!poolEntry) {
            throw new Error(`Pool not found for dbName: ${dbName}`);
        }
        // Use type assertion to tell TypeScript that `connection` is of type `Knex`
        return poolEntry.connection as Knex;
    }

    private async restartPool(dbName: z.infer<(typeof ConnectionSchema)>['database']): Promise<void> {
        try {
            const pool = this.getPool(dbName)
            if (pool) {
                await pool.destroy()
                this.pools.delete(dbName)
                this.createPool(dbName)
            }
        } catch (error) {
            console.error(`Ошибка при перезапуске пула ${dbName}:`, error)
        }
    }

    private async restartPools(): Promise<void> {
        try {
            for (const key of this.pools.keys()) {
                const pool = this.getPool(key)
                await pool.destroy()
            }
            this.pools.clear()
            for (const dbName of this.connectionOtions.keys()) {
                this.createPool(dbName)
            }
        } catch (error) {
            console.error('Ошибка при перезапуске пулов:', error)
            // Запланировать повторный перезапуск через 5 минут
            setTimeout(() => this.restartPools(), 5 * 60 * 1000)
        }
    }

    public async executeQuery<T>(
        dbName: KnexConfiguration['connection']['database'],
        query: string,
        parameters: any[] = [],
    ): Promise<T[]> {
        const connection = this.getPool(dbName)
        try {
            // Установка group_concat_max_len перед основным запросом
            await connection.raw('SET SESSION group_concat_max_len = 5000000')

            const result = await connection.raw(query, parameters)
            return result[0]
        } catch (error) {
            console.error(`Ошибка при выполнении запроса: ${query}`, error)
            throw error
        }
    }
}
