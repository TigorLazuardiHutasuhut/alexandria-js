/**
 * Config example:
 *
 * ```typescript
 * {
 *      sentry: {
 *          enable: true,
 *          dsn: "https://[sentry key]@sentry.io/[sentry service id]"
 *          tags: { environment: "production" }
 *          useStackTrace: false
 *          level: 'fatal'
 *      }
 * }
 * ```
 */
export interface AlexandriaConfig {
    sentry?: Sentry
    apm?: APM
    fluent?: Fluent
    kafka?: Kafka
    serviceName: string
    serviceVersion: string
    serviceEnvironment: string
}

/**
 * Enables integration with Sentry if `enable` is set to true. Defaults to `fatal` level only.
 */
export interface Sentry {
    enable: boolean
    /**
     * Sentry dsn.
     *
     * Example:
     *
     * ```
     * dsn: "https://[sentry key]@sentry.io/[sentry service id]"
     * ```
     */
    dsn: string
    /**
     * Any key with string value is valid.
     * This will be used for tagging services in sentry for easier searching.
     *
     * Example:
     *
     * ```typescript
     * {
     *  // ...
     *      tags: { "service name": "some service" }
     *  // ...
     * {
     * ```
     */
    tags?: { [key: string]: string }
    /**
     * Set wether to send stack trace as payload as well. Default `false`.
     */
    useStackTrace?: boolean
    /**
     * Set on what level will the payload send to senty. Default is `fatal`.
     */
    level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
}

/**
 * Enables integration with APM if `enable` is set to true.
 */
export interface APM {
    enable: boolean
    url: string
    /**
     * Set wether to send stack trace as payload as well. Default `false`.
     */
    useStackTrace?: boolean
    /**
     * Set on what level will the <i>automatic</i> payload send to apm. Default is `fatal`.
     */
    level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
    token?: string
}

export interface Fluent {
    enable?: boolean
    tag?: string
    host?: string
    port?: number
    timeout?: number
    reconnectInterval?: number
    /**
     * Set on what level will the <i>automatic</i> payload send to fluent. Default is `info`.
     */
    level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
}

export interface Kafka {
    enable: boolean
    topic: string
    brokers: string[]
    topicPrefix?: string
    topicSuffix?: string
    /**
     * Set on what level will the <i>automatic</i> payload send to senty. Default is `info`.
     */
    level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
}

export interface Levels {
    apmLevel: number
    fluentLevel: number
    kafkaLevel: number
    sentryLevel: number
}
