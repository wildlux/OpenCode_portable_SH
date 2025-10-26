import { domain } from "./stage"
import { EMAILOCTOPUS_API_KEY } from "./app"

////////////////
// DATABASE
////////////////

const cluster = planetscale.getDatabaseOutput({
  name: "opencode",
  organization: "anomalyco",
})

const branch =
  $app.stage === "production"
    ? planetscale.getBranchOutput({
        name: "production",
        organization: cluster.organization,
        database: cluster.name,
      })
    : new planetscale.Branch("DatabaseBranch", {
        database: cluster.name,
        organization: cluster.organization,
        name: $app.stage,
        parentBranch: "production",
      })
const password = new planetscale.Password("DatabasePassword", {
  name: $app.stage,
  database: cluster.name,
  organization: cluster.organization,
  branch: branch.name,
})

export const database = new sst.Linkable("Database", {
  properties: {
    host: password.accessHostUrl,
    database: cluster.name,
    username: password.username,
    password: password.plaintext,
    port: 3306,
  },
})

new sst.x.DevCommand("Studio", {
  link: [database],
  dev: {
    command: "bun db studio",
    directory: "packages/console/core",
    autostart: true,
  },
})

////////////////
// AUTH
////////////////

const GITHUB_CLIENT_ID_CONSOLE = new sst.Secret("GITHUB_CLIENT_ID_CONSOLE")
const GITHUB_CLIENT_SECRET_CONSOLE = new sst.Secret("GITHUB_CLIENT_SECRET_CONSOLE")
const GOOGLE_CLIENT_ID = new sst.Secret("GOOGLE_CLIENT_ID")
const authStorage = new sst.cloudflare.Kv("AuthStorage")
export const auth = new sst.cloudflare.Worker("AuthApi", {
  domain: `auth.${domain}`,
  handler: "packages/console/function/src/auth.ts",
  url: true,
  link: [database, authStorage, GITHUB_CLIENT_ID_CONSOLE, GITHUB_CLIENT_SECRET_CONSOLE, GOOGLE_CLIENT_ID],
})

////////////////
// GATEWAY
////////////////

export const stripeWebhook = new stripe.WebhookEndpoint("StripeWebhookEndpoint", {
  url: $interpolate`https://${domain}/stripe/webhook`,
  enabledEvents: [
    "checkout.session.async_payment_failed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.completed",
    "checkout.session.expired",
    "charge.refunded",
    "customer.created",
    "customer.deleted",
    "customer.updated",
    "customer.discount.created",
    "customer.discount.deleted",
    "customer.discount.updated",
    "customer.source.created",
    "customer.source.deleted",
    "customer.source.expiring",
    "customer.source.updated",
    "customer.subscription.created",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.pending_update_applied",
    "customer.subscription.pending_update_expired",
    "customer.subscription.resumed",
    "customer.subscription.trial_will_end",
    "customer.subscription.updated",
  ],
})

const ZEN_MODELS = new sst.Secret("ZEN_MODELS")
const STRIPE_SECRET_KEY = new sst.Secret("STRIPE_SECRET_KEY")
const AUTH_API_URL = new sst.Linkable("AUTH_API_URL", {
  properties: { value: auth.url.apply((url) => url!) },
})
const STRIPE_WEBHOOK_SECRET = new sst.Linkable("STRIPE_WEBHOOK_SECRET", {
  properties: { value: stripeWebhook.secret },
})

////////////////
// CONSOLE
////////////////

const AWS_SES_ACCESS_KEY_ID = new sst.Secret("AWS_SES_ACCESS_KEY_ID")
const AWS_SES_SECRET_ACCESS_KEY = new sst.Secret("AWS_SES_SECRET_ACCESS_KEY")

let logProcessor
if ($app.stage === "production" || $app.stage === "frank") {
  const HONEYCOMB_API_KEY = new sst.Secret("HONEYCOMB_API_KEY")
  logProcessor = new sst.cloudflare.Worker("LogProcessor", {
    handler: "packages/console/function/src/log-processor.ts",
    link: [HONEYCOMB_API_KEY],
  })
}

new sst.cloudflare.x.SolidStart("Console", {
  domain,
  path: "packages/console/app",
  link: [
    database,
    AUTH_API_URL,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_SECRET_KEY,
    ZEN_MODELS,
    EMAILOCTOPUS_API_KEY,
    AWS_SES_ACCESS_KEY_ID,
    AWS_SES_SECRET_ACCESS_KEY,
  ],
  environment: {
    //VITE_DOCS_URL: web.url.apply((url) => url!),
    //VITE_API_URL: gateway.url.apply((url) => url!),
    VITE_AUTH_URL: auth.url.apply((url) => url!),
  },
  transform: {
    server: {
      transform: {
        worker: {
          placement: { mode: "smart" },
          tailConsumers: logProcessor ? [{ service: logProcessor.nodes.worker.scriptName }] : [],
        },
      },
    },
  },
})
