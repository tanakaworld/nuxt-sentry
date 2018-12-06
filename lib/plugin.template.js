import Vue from 'vue'
import * as Sentry from '@sentry/browser'

// NOTE: this plugin is depends on nuxt-env
export default function (context, inject) {
  const opts = Object.assign({}, <%= serialize(options) %>, {
    // Use default browser integrations
    defaultIntegrations: false,
    integrations: [
      new Sentry.Integrations.Dedupe,
      new Sentry.Integrations.InboundFilters,
      new Sentry.Integrations.FunctionToString,
      new Sentry.Integrations.TryCatch,
      new Sentry.Integrations.Breadcrumbs,
      new Sentry.Integrations.GlobalHandlers,
      new Sentry.Integrations.LinkedErrors,
      new Sentry.Integrations.UserAgent,
      new Sentry.Integrations.Vue({ Vue })
    ]
  });

  // Set via nuxt-env if it's exists
  if (context.app.$env.SENTRY_DSN) opts.dsn = context.app.$env.SENTRY_DSN;
  if (context.app.$env.SENTRY_ENVIRONMENT) opts.environment = context.app.$env.SENTRY_ENVIRONMENT;
  if (context.app.$env.SENTRY_RELEASE) opts.release = context.app.$env.SENTRY_RELEASE;

  // Setup sentry
  Sentry.init(opts);

  // Inject Sentry to the context as $sentry
  context.$sentry = Sentry;
  inject('sentry', Sentry);
}
