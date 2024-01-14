import { logger } from '@nuxt/kit'
import knex, { Knex } from 'knex'
import { z } from 'zod'
import defu from 'defu'
import { Pool } from './pool-class'
import { cronManager } from './cron-class'

import type { CronManager, Interval } from './cron-class'
import type { ModuleOptions } from '../../types'
import { ConnectionConfigSchema, sqlite3ConnectionSchema, mySqlConnectionSchema } from '../../types'

export class KnexConnection {
    private knex = knex
    private pool: Pool

    constructor(public config: ModuleOptions['configs'][number]) {
        this.pool = new Pool(this.knex(this.config))
    }

    get connection() {
        return this.pool.pool.connection
    }

    get poolInspector() {
        return this.pool.getInspector()
    }

    get _pool() {
        return this.pool
    }
}

function makeSchemaOptional<T extends ModuleOptions['configs'][number]>(schema: T) {
    return schema.client === 'sqlite3' ? sqlite3ConnectionSchema : mySqlConnectionSchema
}

function getKey<T extends ModuleOptions['configs'][number]>(schema: T) {
    return z.literal(schema.client === 'sqlite3' ? schema.connection.filename : schema.connection.database)
}

function makeMap<T extends ModuleOptions['configs'][number]>(schema: T) {
    const key = getKey(schema)
    return z.map(key, z.instanceof(Pool))
}

function CP<T extends Pool>(schema: T) {
    return schema.pool.connection.client.database()
}

const poolsScheam = z.map(z.string(), z.instanceof(Pool))

export class KnexUniverce<T extends ModuleOptions['configs']> {
    public pools = poolsScheam.parse(new Map())
    constructor(configs: T) {
        this.init(configs)
    }

    private init(configs: T) {
        configs.forEach((config) => {
            const pool = new KnexConnection(config)
            const key = config.client === 'sqlite3' ? config.connection.filename : config.connection.database
            makeMap(config).parse(this.pools.set(key, pool._pool))
        })
    }

    get dbs() {
        const pools = [...this.pools.entries()] as const
        return {
            ...Object.fromEntries(pools.map(([key, pool]) => [key, this.getPool(key)!]))
        } as const
    }

    getPool(key: string) {
        return this.pools.get(key)?.pool.connection
    }

    get queryBuilders() {
        const pools = [...this.pools.entries()] as const
        return {
            ...Object.fromEntries(pools.map(([key, pool]) => [key, this.getPool(key)!.queryBuilder]))
        } as const
    }

    get schemas() {
        const pools = [...this.pools.entries()] as const
        return {
            ...Object.fromEntries(pools.map(([key, pool]) => [key, this.getPool(key)!.schema]))
        } as const
    }

    get clients() {
        const pools = [...this.pools.entries()] as const
        return {
            ...Object.fromEntries(pools.map(([key, pool]) => [key, this.getPool(key)!.client]))
        } as const
    }

    get poolInspectors() {
        const pools = [...this.pools.entries()] as const
        return {
            ...Object.fromEntries(pools.map(([key, pool]) => [key, pool.getInspector()]))
        } as const
    }

    setJob(key: string, onTick: () => Promise<void>, interval: Interval) {
        const pool = this.getPool(key)!

        cronManager.scheduleJob(key, { interval, onTick })
    }
}