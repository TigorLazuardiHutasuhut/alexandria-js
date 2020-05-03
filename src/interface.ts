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
    traceCaller?: boolean
    serviceName: string
    serviceVersion: string
    serviceEnvironment: string
    verbose?: boolean
    monitorUncaughtException?: boolean
    monitorUncaughtExceptionDelay?: number
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
    level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
}

/**
 * Enables integration with APM if `enable` is set to true.
 */
export interface APM {
    enable: boolean
    url: string
    level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
    token?: string
}

export interface Fluent {
    enable?: boolean
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
