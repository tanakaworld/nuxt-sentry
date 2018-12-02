jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
process.env.PORT = process.env.PORT || 5060;
process.env.NODE_ENV = "production";

const { Nuxt, Builder } = require("nuxt");
const request = require("request-promise-native");
const config = require("./fixtures/nuxt.config");

const url = path => `http://localhost:${process.env.PORT}${path}`;
const get = path => request(url(path));

describe("nuxt-sentry module", () => {
  let nuxt, addTemplate;

  beforeAll(async () => {
    // Build a fresh nuxt
    nuxt = new Nuxt(config);
    // Spy addTemplate
    addTemplate = nuxt.moduleContainer.addTemplate = jest.fn(
      nuxt.moduleContainer.addTemplate
    );
    await new Builder(nuxt).build();
    await nuxt.listen(process.env.PORT);
  });

  afterAll(async () => {
    // Close all opened resources
    await nuxt.close();
  });

  describe("module", () => {
    test("render is works", async () => {
      let html = await get("/");
      expect(html).toContain("Test Page :)");
    });
  });

  describe("plugin", async () => {
    test("$sentry is injected", async () => {
      const window = await nuxt.renderAndGetWindow(url("/"));
      const $sentry = window.$nuxt.$sentry;
      expect($sentry).toBeDefined();
    });

    describe("$env", () => {
      test("$env is injected", async () => {
        const window = await nuxt.renderAndGetWindow(url("/"));
        const $env = window.$nuxt.$env;
        expect($env).toBeDefined();
      });
      test("SENTRY_DSN in process is set to $env", async () => {
        const window1 = await nuxt.renderAndGetWindow(url("/"));
        expect(window1.$nuxt.$env.SENTRY_DSN).toBeUndefined();

        process.env.SENTRY_DSN = "https://xxxxxxxxxxxxxx@sentry.io/yyyyyyyyy";

        const window2 = await nuxt.renderAndGetWindow(url("/"));
        expect(window2.$nuxt.$env.SENTRY_DSN).toEqual(
          "https://xxxxxxxxxxxxxx@sentry.io/yyyyyyyyy"
        );

        process.env.SENTRY_DSN = undefined;
      });
    });
  });
});
