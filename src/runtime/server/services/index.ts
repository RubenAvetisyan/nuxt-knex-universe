import { logger } from '@nuxt/kit'
import type { DbConfig, DbName } from '../../knex/knex-class'
import { KnexConnection } from '../../knex/knex-class'
import { useRuntimeConfig } from '#imports'

const cg = useRuntimeConfig().knexConnections.configs as unknown as DbConfig[]
const dbNames = cg.map((config) => config.connection.database)

type DbConfigs = typeof cg

export const DbNames: Record<string, string> = {};

dbNames.forEach((dbName) => {
    DbNames[dbName] = dbName;
});

class DbConnection {
    private readonly dbConfigs: DbConfigs = cg
    dbs: Map<typeof cg[number]['connection']['database'], KnexConnection<typeof cg[number]>> = new Map()

    constructor() {
        this.init()
    }

    async init() {
        this.dbConfigs.forEach((config) => {
            this.dbs.set(config.connection.database, new KnexConnection<typeof config>(config))
        })

        logger.info(this.dbs.size)
    }

    getDatabase(databaseName: DbName<DbConfigs[number]>) {
        return this.dbs.get(databaseName)
    }
}

export let databases: DbConnection

export function defineKnexConnection() {
    return databases = new DbConnection()
}
