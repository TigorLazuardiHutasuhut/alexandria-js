import { AlexandriaConfig, Levels } from './interface'
import sentry from '@sentry/node'
import winston, { Logger as Winston } from 'winston'
import apm from 'elastic-apm-node/start'
import agent from 'elastic-apm-node/index'
import fluent, { FluentSender } from 'fluent-logger'
import kafka, { KafkaClient, Producer as KafkaProducer } from 'kafka-node'
import { AlexandriaBaseEntry, AlexandriaEntry, Entry } from './logger'

export type APMAgent = typeof agent

export interface Instances {
    winston: Winston
    apm?: APMAgent
    fluent?: FluentSender<any>
    kafka?: KafkaProducer
}

class Alexandria {
    private config?: AlexandriaConfig
    private instances: Instances
    private levels?: Levels
    /**
     * Creates new Alexandria instance. If config is not passed,
     * Alexandria only logs to stdout and also without service identification.
     *
     * No need to pass all configurations. Alexandria will only log
     * to services with valid configurations.
     *
     * Example Full-Config:
     * ```typescript
     * const Alexandria = require('alexandria')
     * const env = process.env.NODE_ENV === 'production'
     * const alexa = new Alexandria({
     *     serviceName : "Service A", // Required
     *     serviceVersion : "1.0.0", // Required
     *     serviceEnvironment : process.env.NODE_ENV || "production", // Required
     *     sentry: { // Optional
     *         enable: env,
     *         dsn: 'https://key@sentry.io/service_id',
     *         level: 'fatal',
     *     },
     *     apm: { // Optional
     *         enable: env,
     *         url: 'http://localhost:8200'
     *         level: 'fatal',
     *     },
     *     fluent: { // Optional
     *         enable: env,
     *         host: 'localhost',
     *         port: '24224',
     *         level: 'info',
     *     },
     *     kafka : { // Optional
     *         enable: env,
     *         topic: 'some_job',
     *         brokers: 'http://localhost:2181',
     *         topicPrefix: new Date(
     *                 new Date().getTime() - (new Date().getTimezoneOffset() * 60000)
     *             ).toISOString().split('T')[0],
     *         topicSuffix: 'log',
     *         level: 'info',
     *     }, // Generate and log to new topic with format 'yyyy-mm-dd.some_job.log'
     *     verbose: false,
     * })
     * ```
     */
    constructor(config?: AlexandriaConfig) {
        this.instances = {
            winston: winston.createLogger({
                level: 'info',
                format: winston.format.json(),
                defaultMeta: {
                    name: config?.serviceName,
                    version: config?.serviceVersion,
                    environment: config?.serviceEnvironment,
                },
                transports: [
                    new winston.transports.Console({
                        format: winston.format.json(),
                    }),
                ],
            }),
        }
        if (this.config?.monitorUncaughtException !== false) {
            setTimeout(() => {
                ;(process as NodeJS.EventEmitter).on(
                    'uncaughtExceptionMonitor',
                    (err: Error, origin: string) => {
                        const entry: Entry = {
                            level: 'fatal',
                            time: new Date().toISOString(),
                            code: 5500,
                            error: err,
                            caller: origin,
                            data: null,
                            message:
                                'Uncaught Exception captured by Alexandria',
                        }
                        const message = JSON.stringify(entry)
                        this.instances.winston.log({ level: 'fatal', message })
                        this.instances.apm?.captureError(message)
                        this.config?.sentry?.enable &&
                            sentry.captureException(message)
                    },
                )
            }, this.config?.monitorUncaughtExceptionDelay || 30000)
        }
        if (typeof config === 'undefined') {
            return
        }
        this.config = config
        if (config.apm?.enable) {
            this.instances.apm = apm.start({
                serviceName: config.serviceName,
                serverUrl: config.apm.url,
                secretToken: config.apm.token,
            })
        }
        if (config.sentry?.enable) {
            sentry.init({ dsn: config.sentry.dsn })
            sentry.configureScope((scope: sentry.Scope) => {
                scope.setTag('name', config.serviceName)
                scope.setTag('version', config.serviceVersion)
                scope.setTag('environment', config.serviceEnvironment)
            })
        }
        if (config.fluent?.enable) {
            this.instances.fluent = fluent.createFluentSender(
                config.serviceName,
                {
                    host: config.fluent?.host,
                    port: config.fluent?.port,
                    timeout: config.fluent.timeout || 3,
                    reconnectInterval:
                        config.fluent.reconnectInterval || 600000,
                },
            )
        }
        if (config.kafka?.enable) {
            this.instances.kafka = new kafka.Producer(
                new KafkaClient({
                    kafkaHost: config.kafka.brokers.join(','),
                }),
            )
        }
        this.levels = this.parseLevels()
    }
    private parseLevels(): Levels {
        let apmLevel: number
        let fluentLevel: number
        let kafkaLevel: number
        let sentryLevel: number
        switch (this.config?.apm?.level?.toLowerCase()) {
            case 'debug':
                apmLevel = 4
                break
            case 'info':
                apmLevel = 3
                break
            case 'warn':
                apmLevel = 2
                break
            case 'error':
                apmLevel = 1
                break
            case 'fatal':
                apmLevel = 0
                break
            default:
                apmLevel = 0
                break
        }
        switch (this.config?.fluent?.level?.toLowerCase()) {
            case 'debug':
                fluentLevel = 4
                break
            case 'info':
                fluentLevel = 3
                break
            case 'warn':
                fluentLevel = 2
                break
            case 'error':
                fluentLevel = 1
                break
            case 'fatal':
                fluentLevel = 0
                break
            default:
                fluentLevel = 3
                break
        }
        switch (this.config?.kafka?.level?.toLowerCase()) {
            case 'debug':
                kafkaLevel = 4
                break
            case 'info':
                kafkaLevel = 3
                break
            case 'warn':
                kafkaLevel = 2
                break
            case 'error':
                kafkaLevel = 1
                break
            case 'fatal':
                kafkaLevel = 0
                break
            default:
                kafkaLevel = 3
                break
        }
        switch (this.config?.sentry?.level?.toLowerCase()) {
            case 'debug':
                sentryLevel = 4
                break
            case 'info':
                sentryLevel = 3
                break
            case 'warn':
                sentryLevel = 2
                break
            case 'error':
                sentryLevel = 1
                break
            case 'fatal':
                sentryLevel = 0
                break
            default:
                sentryLevel = 0
                break
        }
        return {
            apmLevel,
            fluentLevel,
            kafkaLevel,
            sentryLevel,
        }
    }

    /**
     * log creates a new entry logging instance.
     *
     * Please note this does not do anything except creating instance.
     *
     * log have to be chained with `.info()`, or `.error()`, 
     etc to actually do the jobs and send log to services.
     *
     * Example:
     * ```typescript
     * const Alexandria = require('alexandria')
     * const alexa = new Alexandria({ ... })
     * // ...
     * alexa.log({
     *      code: 2200,        // Default 5500
     *      data: {foo: "bar"} // Default null
     *      error: null,       // Default null
     *      message: "Success" // Default null
     * })                       // Creates log instance.
     * ```
     *
     * Example to Print to console:
     * ```typescript
     * alexa.log({
     *      code: 2200,        // Default 5500
     *      data: {foo: "bar"} // Default null
     *      error: null,       // Default null
     *      message: "Success" // Default null
     * }).print()               // Alias to .info()
     * ```
     */
    log(entry: AlexandriaBaseEntry): AlexandriaEntry {
        return new AlexandriaEntry(
            entry,
            this.instances,
            this.config,
            this.levels,
        )
    }
}

export default Alexandria
