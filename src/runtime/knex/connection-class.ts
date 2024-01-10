import { useRuntimeConfig } from '#imports'
import type { DbConfig, DbName } from './knex-class'
import { KnexConnection } from './knex-class'
import { log } from '../messageOut'

const cg = useRuntimeConfig().dbConfigs as unknown as DbConfig[]
const dbNames = cg.map((config) => config.connection.database)

type DbConfigs = typeof cg
export type DbNames = typeof dbNames
// type C = ExactConnection<DbConfigs[number]>

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

        console.info(this.dbs.size)
    }

    getDatabase(databaseName: DbName<DbConfigs[number]>) {
        return this.dbs.get(databaseName)
    }
}

export const databases = new DbConnection() 
