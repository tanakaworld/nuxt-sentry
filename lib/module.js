const Sentry = require("@sentry/node");
const path = require("path");

const logger = require("consola").withScope("nuxt:sentry");

module.exports = function Module(moduleOptions) {
  // Merge options
  const options = Object.assign(
    // default
    {
      disabled: process.env.SENTRY_DISABLED,
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT,
      release: process.env.SENTRY_RELEASE
    },
    this.options.sentry,
    moduleOptions
  );

  // Don't proceed if it's disabled
  if (options.disabled) {
    logger.info("Disabled because the disabled option is set");
    return;
  }

  // Setup sentry
  Sentry.init(options);

  // Register the client plugin
  this.addPlugin({
    src: path.resolve(__dirname, "plugin.template.js"),
    fileName: "nuxt-sentry-client.js",
    ssr: false,
    options
  });

  // NOTE: nuxt-sentry-client.js is depends on nuxt-env.
  this.requireModule([
    "nuxt-env",
    {
      keys: ["SENTRY_DISABLED", "SENTRY_DSN", "SENTRY_ENVIRONMENT", "SENTRY_RELEASE"]
    }
  ]);

  // Hooks
  this.nuxt.hook("render:setupMiddleware", app =>
    app.use(Sentry.Handlers.requestHandler())
  );
  this.nuxt.hook("render:errorMiddleware", app =>
    app.use(Sentry.Handlers.errorHandler())
  );
  this.nuxt.hook("generate:routeFailed", ({ route, errors }) => {
    errors.forEach(({ error }) =>
      Sentry.withScope(scope => {
        scope.setExtra("route", route);
        Sentry.captureException(error);
      })
    );
  });
};
