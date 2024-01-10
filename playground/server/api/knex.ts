import { defineEventHandler } from 'h3'
import { databases, DbNames } from '#nuxt/knex-universe'

export default defineEventHandler(async (event) => {
    // const res = await event.context.data.dbs.executeQuery('billing', 'SELECT * FROM contract')
    const db = databases.getDatabase('billing')

    const res = db?.executeQuery('SELECT * FROM contract LIMIT 10')
    console.log('res: ', res);
    // console.log('dbs: ', databases.getDatabase('billing').executeQuery('billing', 'SELECT * FROM contract'));
    return 'ok'
})
