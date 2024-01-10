import type { Nuxt } from 'nuxt/schema'
import type { WebSocketServer } from 'vite'
import type { ModuleOptions } from '../module'

export interface DevtoolsServerContext {
    nuxt: Nuxt
    options: ModuleOptions
    wsServer: Promise<WebSocketServer>
}