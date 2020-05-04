# Alexandria

Alexandria is a layer abstraction package to reduce the pain to log to multiple places. By using one
method and chain it with levels of logging, you can easily send logs to services with pre determined
logging levels.

# Installation

```shell
npm install "https://github.com/TigorLazuardiHutasuhut/alexandria-js"
```

# Initialization

Example Full-Config:

```typescript
const Alexandria = require('alexandria')
const env = process.env.NODE_ENV === 'production'
const alexa = new Alexandria({
    serviceName : 'Service A', // Required
    serviceVersion : '1.0.0', // Required
    serviceEnvironment : process.env.NODE_ENV || 'production', // Required
    sentry: { // Optional
        enable: env,
        dsn: 'https://key@sentry.io/service_id',
        level: 'fatal',
    },
    apm: { // Optional
        enable: env,
        url: 'http://localhost:8200'
        level: 'fatal',
    },
    fluent: { // Optional
        enable: env,
        host: 'localhost',
        port: '24224',
        level: 'info',
    },
    kafka : { // Optional
        enable: env,
        topic: 'some_job',
        brokers: 'http://localhost:2181',
        topicPrefix: 'foo',
        topicSuffix: 'bar',
        level: 'info',
    }, // Generate and log to new topic with format 'foo.some_job.bar'
    verbose: false,
    monitorUncaughtException: true,
    monitorUncaughtExceptionDelay: 30000,
})
```

# Example Usage

Create log instance:

```typescript
alexa.log({
    code: 2200,        // Default 5500
    data: {foo: "bar"} // Any type, Default null
    error: null,       // Default null
    message: "Success" // Default null
})                     // Creates log instance.
```

Example to Print to console and send log to services which are enabled and have levels set to `info`:

```typescript
alexa.log({
    code: 2200,        // Default 5500
    data: {foo: "bar"} // Default null
    error: null,       // Default null
    message: "Success" // Default null
}).print()             // Alias to .info()
```
