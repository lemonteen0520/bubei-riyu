import { registerPlugin } from '@capacitor/core'

export interface UpdaterPlugin {
  install(options: { url: string }): Promise<{ value: boolean }>
}

const Updater = registerPlugin<UpdaterPlugin>('Updater')

// 暴露给 services/updater.ts 调用
;(window as unknown as { Updater: UpdaterPlugin }).Updater = Updater
