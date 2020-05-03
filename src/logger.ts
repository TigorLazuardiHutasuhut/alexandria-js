import { AlexandriaConfig, Levels } from './interface'
import { Instances } from './alexandria'
import sentry from '@sentry/node'

export interface AlexandriaBaseEntry {
    code?: number
    data?: any | null
    error?: Error | null
    message?: string | null
}

interface Entry {
    caller?: string
    time: string
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | null
    data?: any | null
    code?: number
    error?: Error | null
    message?: string | null
}

export class AlexandriaEntry {
    private entry: Entry
    constructor(
        baseEntry: AlexandriaBaseEntry,
        private instances: Instances,
        private config?: AlexandriaConfig,
        private levels?: Levels,
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
    private getCaller(): string | undefined {
        let err: Error
        try {
            throw Error('')
        } catch (e) {
            err = e
        }
        return err.stack?.split('\n')[4]
    }

    debug() {
        this.entry.level = 'debug'
        if (this.config?.traceCaller) {
            this.entry.caller = this.getCaller()
        }
        const payload = JSON.stringify(this.entry)
        setTimeout(() => {
            if (this.config?.apm?.enable) {
                this.instances.apm?.logger.debug(payload)
            }
        }, 0)
        setTimeout(() => {
            if (this.config?.fluent?.enable) {
                this.instances.fluent?.emit(
                    this.config.serviceName,
                    this.entry,
                    Date.now(),
                )
            }
        }, 0)
        setTimeout(() => {
            if (this.config?.sentry?.enable) {
                sentry.captureMessage(payload)
            }
        }, 0)
        setTimeout(() => {
            if (this.config?.kafka?.enable) {
                this.instances.kafka?.send(
                    [
                        {
                            topic: this.config.kafka.topic,
                            messages: payload,
                        },
                    ],
                    () => {},
                )
            }
        })
        this.instances.winston.log({ level: 'debug', message: payload })
    }

    info() {
        this.entry.level = 'info'
        const payload = JSON.stringify(this.entry)
        setTimeout(() => {
            if (
                this.config?.apm?.enable && this.levels?.apmLevel
                    ? this.levels.apmLevel < 4
                    : false
            ) {
                this.instances.apm?.logger.info(payload)
            }
        }, 0)
        setTimeout(() => {
            if (
                this.config?.fluent?.enable && this.levels?.fluentLevel
                    ? this.levels.fluentLevel < 4
                    : false
            ) {
                this.instances.fluent?.emit(
                    this.config?.serviceName || '',
                    this.entry,
                    Date.now(),
                )
            }
        }, 0)
        setTimeout(() => {
            if (
                this.config?.sentry?.enable && this.levels?.sentryLevel
                    ? this.levels.sentryLevel < 4
                    : false
            ) {
                sentry.captureMessage(payload)
            }
        }, 0)
        setTimeout(() => {
            if (
                this.config?.kafka?.enable && this.levels?.kafkaLevel
                    ? this.levels.kafkaLevel < 4
                    : false
            ) {
                this.instances.kafka?.send(
                    [
                        {
                            topic: [
                                this.config!.kafka!.topicPrefix,
                                this.config!.kafka!.topic,
                                this.config!.kafka!.topicSuffix,
                            ].join('.'),
                            messages: payload,
                        },
                    ],
                    () => {},
                )
            }
        })
        this.instances.winston.log({ level: 'info', message: payload })
    }

    warn() {
        this.entry.level = 'warn'
        const payload = JSON.stringify(this.entry)
        setTimeout(() => {
            if (this.config.apm?.enable && this.levels.apmLevel < 3) {
                this.instances.apm?.logger.warn(payload)
            }
        }, 0)
        setTimeout(() => {
            if (this.config.fluent?.enable && this.levels.fluentLevel < 3) {
                this.instances.fluent?.emit(
                    this.config.serviceName,
                    this.entry,
                    Date.now(),
                )
            }
        }, 0)
        setTimeout(() => {
            if (this.config.sentry?.enable && this.levels.sentryLevel < 3) {
                sentry.captureMessage(payload)
            }
        }, 0)
        setTimeout(() => {
            if (this.config.kafka?.enable && this.levels.kafkaLevel < 3) {
                this.instances.kafka?.send(
                    [
                        {
                            topic: this.config.kafka.topic,
                            messages: payload,
                        },
                    ],
                    () => {},
                )
            }
        })
        this.instances.winston.log({ level: 'warning', message: payload })
    }

    error() {
        this.entry.level = 'error'
        const payload = JSON.stringify(this.entry)
        setTimeout(() => {
            if (this.config.apm?.enable && this.levels.apmLevel < 2) {
                this.instances.apm?.logger.error(payload)
            }
        }, 0)
        setTimeout(() => {
            if (this.config.fluent?.enable && this.levels.fluentLevel < 2) {
                this.instances.fluent?.emit(
                    this.config.serviceName,
                    this.entry,
                    Date.now(),
                )
            }
        }, 0)
        setTimeout(() => {
            if (this.config.sentry?.enable && this.levels.sentryLevel < 2) {
                sentry.captureException(payload)
            }
        }, 0)
        setTimeout(() => {
            if (this.config.kafka?.enable && this.levels.kafkaLevel < 2) {
                this.instances.kafka?.send(
                    [
                        {
                            topic: this.config.kafka.topic,
                            messages: payload,
                        },
                    ],
                    () => {},
                )
            }
        })
        this.instances.winston.log({ level: 'error', message: payload })
    }

    fatal() {
        this.entry.level = 'fatal'
        const payload = JSON.stringify(this.entry)
        setTimeout(() => {
            if (this.config.apm?.enable) {
                this.instances.apm?.logger.fatal(payload)
            }
        }, 0)
        setTimeout(() => {
            if (this.config.fluent?.enable) {
                this.instances.fluent?.emit(
                    this.config.serviceName,
                    this.entry,
                    Date.now(),
                )
            }
        }, 0)
        setTimeout(() => {
            if (this.config.sentry?.enable) {
                sentry.captureException(payload)
            }
        }, 0)
        setTimeout(() => {
            if (this.config.kafka?.enable) {
                this.instances.kafka?.send(
                    [
                        {
                            topic: this.config.kafka.topic,
                            messages: payload,
                        },
                    ],
                    () => {},
                )
            }
        })
        this.instances.winston.log({ level: 'emerg', message: payload })
    }
}
