import { createError } from 'h3'
import { CronJob, CronJobParams } from 'cron'

type TimeUnit =
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'months'
  | 'weeks'
  | 'years'

export interface Interval {
  value: number
  unit: TimeUnit
}

interface CustomCronJobParameters extends Omit<CronJobParams, 'cronTime'> {
  cronTime?: string
  interval: Interval
}

class CronJobManager {
  private _cronJobs: Map<string, CronJob>

  constructor() {
    this._cronJobs = new Map()
  }

  createCronTimeString(interval: number, unit: TimeUnit): string {
    let cronString = ''

    switch (unit) {
      case 'seconds':
        cronString = `*/${interval} * * * * *`
        break
      case 'minutes':
        cronString = `*/${interval} * * * *`
        break
      case 'hours':
        cronString = `0 */${interval} * * *`
        break
      case 'days':
        cronString = `0 0 */${interval} * *`
        break
      case 'weeks':
        cronString = `0 0 * * */${interval}`
        break
      case 'months':
        cronString = `0 0 1 */${interval} *`
        break
      case 'years':
        cronString = `0 0 1 1 */${interval}`
        break
      default:
        throw new Error('Invalid time unit')
    }

    return cronString
  }

  public scheduleJob(
    jobName: string,
    params: CustomCronJobParameters,
  ): CronJob {
    const { interval, onTick, start = true, timeZone = 'Asia/Yerevan' } = params
    const cronTime =
      params.cronTime ||
      this.createCronTimeString(interval.value, interval.unit)
    const cronJob = CronJob.from({
      cronTime,
      onTick,
      start,
      timeZone,
    })
    this._cronJobs.set(jobName, cronJob)
    return cronJob
  }

  getJob(key: string) {
    if (this._cronJobs.has(key)) return this._cronJobs.get(key) as CronJob

    throw createError(`No such job: ${key}`)
  }

  hasJob(key: string) {
    return this._cronJobs.has(key)
  }

  public stopJob(jobName: string): void {
    if (!this._cronJobs) throw new Error('this OR _cronJobs is not initialized')

    const cronJob = this._cronJobs.get(jobName)
    if (cronJob) {
      cronJob.stop()
      this._cronJobs.delete(jobName)
    }
  }
}

export default CronJobManager
