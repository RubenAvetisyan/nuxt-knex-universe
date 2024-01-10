import { SchemaInspector } from 'knex-schema-inspector'
import type { Knex } from 'knex'

type Inspector = ReturnType<typeof SchemaInspector>
interface PoolObject {
    connection: Knex
    inspector: Inspector
}

export class Pool {
    public _pool: PoolObject
    constructor(connection: Knex) {
        this._pool = {
            connection,
            inspector: SchemaInspector(connection)
        }
    }

    get pool() {
        return this.pool
    }

    private set pool(pool: PoolObject) {
        this._pool = pool
    }

    getInspector() {
        return this.pool.inspector
    }
}