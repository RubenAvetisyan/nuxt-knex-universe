import { logger } from '@nuxt/kit'
import { KnexUniverce } from '../../knex/knex-class'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from '../../../types'

const cg = useRuntimeConfig().knexConnections.configs as ModuleOptions['configs']

export let databases: KnexUniverce<typeof cg>

export function defineKnexConnection() {
    return databases = new KnexUniverce(cg)
}
