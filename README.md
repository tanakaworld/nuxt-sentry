# nuxt-sentry
[![CircleCI](https://circleci.com/gh/tanakaworld/nuxt-sentry/tree/master.svg?style=svg)](https://circleci.com/gh/tanakaworld/nuxt-sentry)

> A sentry module for Nuxt with nuxt-env

## Features

The module enables error logging through [Sentry](http://sentry.io).

nuxt-env is supported, so you can set DSN via runtime environment.

## Dependencies

- Versions of Nuxt > 1.2.1
- [nuxt-env](https://github.com/samtgarson/nuxt-env)

## Get Started

```bash
$ npm i -S @tanakaworld/nuxt-sentry
# or
$ yarn add @tanakaworld/nuxt-sentry
```

```js
{
  modules: [
    '@tanakaworld/nuxt-sentry'
  ]
  // able to set options via process.env in runtime
}

// or

{
  modules: [
    '@tanakaworld/nuxt-sentry'
  ],
  sentry: {
    disabled: false
  }
}
```

## Usage

Enter your DSN in nuxt.config.js. Additional config settings can be found [here](https://docs.sentry.io/clients/javascript/config/).

### Usage in Vue component

In a Vue component, `Sentry` is available as `this.$sentry`, so we can call functions like

```
this.$sentry.captureException(new Error('example'))
```

where this is a Vue instance.

## Options

Options can be passed using either environment variables or `sentry` section in `nuxt.config.js`.
Normally setting required DSN information would be enough.

### dsn
- Type: `String`
  - Default: `process.env.SENTRY_DSN`

### disabled
- Type: `Boolean`
  - Default: `process.env.SENTRY_DISABLED || false`

### environment
- Type: `String`
  - Default: `process.env.SENTRY_ENVIRONMENT`

### release
- Type: `String`
  - Default: `process.env.SENTRY_RELEASE`


## License

[MIT License](./LICENSE)

Copyright (c) tanakaworld <yutaro.tanaka.world@gmail.com>

