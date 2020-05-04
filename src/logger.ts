import { AlexandriaConfig, Levels } from './interface'
import { Instances } from './alexandria'
import sentry from '@sentry/node'

export interface AlexandriaBaseEntry {
    code?: number
    data?: any | null
    error?: Error | null
    message?: string | null
}

export interface Entry {
    caller?: string
    time: string
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | null
    data?: any | null
    code?: number
    error?: Error | null
    message?: string | null
}

export interface SelectInstances {
    apm: boolean | undefined
    sentry: boolean | undefined
    fluent: boolean | undefined
    kafka: boolean | undefined
}

export class AlexandriaEntry {
    private entry: Entry
    constructor(
        baseEntry: AlexandriaBaseEntry,
        private instances: Instances,
        private levels: Levels,
        private config?: AlexandriaConfig,
    ) {
        if (typeof baseEntry === 'undefined') {
            this.entry = {
                time: new Date().toISOString(),
                level: null,
                code: undefined,
                data: undefined,
                error: undefined,
                message: undefined,
            }
        } else {
            this.entry = {
                time: new Date().toISOString(),
                level: null,
                code: baseEntry.code ? baseEntry.code : 5500,
                data: baseEntry.data ? baseEntry.data : null,
                error: baseEntry.error ? baseEntry.error : null,
                message: baseEntry.message ? baseEntry.message : null,
            }
        }
        this.config = config
        this.instances = instances
    }
    private getCaller(index = 4): string | undefined {
        let err: Error
        try {
            throw Error('')
        } catch (e) {
            err = e
        }
        return err.stack?.split('\n')[index]
    }

    /** Handling Kafka Error */
    private handleKafkaError(err: any) {
        const payload: Entry = {
            code: 5500,
            level: 'fatal',
            caller: this.getCaller(),
            time: new Date().toISOString(),
            data: null,
            error: err,
            message: `An error occurred when sending a message to topic ${this.config?.kafka?.topic}`,
        }
        const message = JSON.stringify(payload)
        if (this.config?.verbose) {
            this.instances.winston.log({
                level: 'fatal',
                message,
            })
        }
        if (this.config?.sentry?.enable) {
            sentry.captureException(message)
        }
        if (this.config?.apm?.enable) {
            this.instances.apm?.captureError(message)
        }
        if (this.config?.fluent?.enable) {
            this.instances.fluent?.emit(this.config?.serviceName || '', message)
        }
    }

    /** sends logs to enabled services and print to stdout */
    private broadCast(
        entry: Entry,
        level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
        instances: SelectInstances,
    ) {
        entry.level = level
        if (this.config?.traceCaller) {
            entry.caller = this.getCaller()
        }
        const payload = JSON.stringify(entry)
        setTimeout(() => {
            if (instances.apm) {
                this.instances.apm?.logger.debug(payload)
            }
        }, 0)
        setTimeout(() => {
            if (instances.fluent) {
                this.instances.fluent?.emit(
                    this.config?.serviceName || '',
                    this.entry,
                    Date.now(),
                )
            }
        }, 0)
        setTimeout(() => {
            if (instances.sentry) {
                sentry.captureMessage(payload)
            }
        }, 0)
        setTimeout(() => {
            if (instances.kafka) {
                this.instances.kafka?.send(
                    [
                        {
                            topic: this.config?.kafka?.topic || '',
                            messages: payload,
                        },
                    ],
                    this.handleKafkaError,
                )
            }
        })
        this.instances.winston.log({ level: level, message: payload })
    }

    /**
     * Send log to all enabled services regardless of levels. Used for debugging.
     */
    debug() {
        this.broadCast(this.entry, 'debug', {
            apm: this.config?.apm?.enable,
            fluent: this.config?.fluent?.enable,
            kafka: this.config?.kafka?.enable,
            sentry: this.config?.sentry?.enable,
        })
    }

    /**
     * Send log to all enabled services with level of 'info' or below.
     */
    info() {
        this.broadCast(this.entry, 'info', {
            apm: this.config?.apm?.enable && this.levels.apmLevel <= 3,
            fluent: this.config?.fluent?.enable && this.levels.fluentLevel <= 3,
            kafka: this.config?.kafka?.enable && this.levels.kafkaLevel <= 3,
            sentry: this.config?.sentry?.enable && this.levels.sentryLevel <= 3,
        })
    }

    /**
     * Send log to all enabled services with level of 'warn' or below.
     */
    warn() {
        this.broadCast(this.entry, 'warn', {
            apm: this.config?.apm?.enable && this.levels.apmLevel <= 2,
            fluent: this.config?.fluent?.enable && this.levels.fluentLevel <= 2,
            kafka: this.config?.kafka?.enable && this.levels.kafkaLevel <= 2,
            sentry: this.config?.sentry?.enable && this.levels.sentryLevel <= 2,
        })
    }

    /**
     * Send log to all enabled services with level of 'error' or below.
     */
    error() {
        this.broadCast(this.entry, 'error', {
            apm: this.config?.apm?.enable && this.levels.apmLevel <= 1,
            fluent: this.config?.fluent?.enable && this.levels.fluentLevel <= 1,
            kafka: this.config?.kafka?.enable && this.levels.kafkaLevel <= 1,
            sentry: this.config?.sentry?.enable && this.levels.sentryLevel <= 1,
        })
    }

    /**
     * Send log to all enabled services with level of 'fatal'.
     */
    fatal() {
        this.broadCast(this.entry, 'fatal', {
            apm: this.config?.apm?.enable && this.levels.apmLevel === 0,
            fluent:
                this.config?.fluent?.enable && this.levels.fluentLevel === 0,
            kafka: this.config?.kafka?.enable && this.levels.kafkaLevel === 0,
            sentry:
                this.config?.sentry?.enable && this.levels.sentryLevel === 0,
        })
    }
}
