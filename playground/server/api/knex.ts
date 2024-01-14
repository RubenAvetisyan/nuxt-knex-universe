import { defineEventHandler } from 'h3'
import { databases } from '#nuxt/knex-universe'
import { useNuxtApp } from 'nuxt/app'

export default defineEventHandler(async (event) => {
    // const res = await event.context.data.dbs.executeQuery('billing', 'SELECT * FROM contract')
    try {
        const db = databases
        console.log('db: ', databases.schemas);

    // await db.schema.createTable('test', function (table) {
    //     table.increments();
    //     table.string('name');
    //     table.timestamps();
    // })

    // const res = db.raw('SELECT * FROM test')

        // console.log(res)
        return 'ok'
    } catch (error: any) {
        throw createError({ statusCode: 500, message: error.message })
    }
})
