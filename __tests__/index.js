process.env.PORT = process.env.PORT || 5060;

const { Nuxt, Builder } = require("nuxt");
const request = require("request-promise-native");
const config = require("./fixtures/nuxt.config");

const TEST_DSN = "https://xxxxxxxxxxxxxx@sentry.io/yyyyyyyyy";

const url = path => `http://localhost:${process.env.PORT}${path}`;
const get = path => request(url(path));

jest.setTimeout(60000);

describe("nuxt-sentry module", () => {
    let nuxt;
    let addTemplate;

    // Helpers
    // TODO extract as common helpers
    const clearNuxt = async () => {
        await nuxt.close();
    };

    const initNuxt = async config => {
        if (nuxt) await clearNuxt();

        // Build a fresh nuxt
        config.dev = false;
        nuxt = new Nuxt(config);
        // Spy addTemplate
        addTemplate = nuxt.moduleContainer.addTemplate = jest.fn(
            nuxt.moduleContainer.addTemplate
        );
        await new Builder(nuxt).build();
        await nuxt.listen(process.env.PORT);
    };

    const getTemplateOptionsFromMock = () => {
        const call = addTemplate.mock.calls.find(args =>
            args[0].src.includes("plugin.template.js")
        );
        return call && call.length > 0 ? call[0].options : null;
    };

    describe("module", () => {
        describe("no options", () => {
            beforeAll(async () => {
                await initNuxt(config);
            });
            afterAll(async () => {
                await clearNuxt();
            });

            test("render is works", async () => {
                const html = await get("/");
                expect(html).toContain("Test Page :)");
            });
            test("no options found", () => {
                expect(addTemplate).toBeDefined();
                const options = getTemplateOptionsFromMock();
                expect(options.disabled).toBeFalsy();
                expect(options.dsn).toBeUndefined();
                expect(options.environment).toBeUndefined();
                expect(options.release).toBeUndefined();
            });
        });

        describe("disabled flag is enabled", () => {
            beforeAll(async () => {
                await initNuxt(
                    Object.assign({}, config, {
                        modules: [["@@"]],
                        sentry: {
                            disabled: true,
                            dsn: "https://dsn@sentry.io/jest",
                            environment: "ENVIRONMENT_FROM_JEST",
                            release: "RELEASE_FROM_JEST"
                        }
                    })
                );
            });
            afterAll(async () => {
                await clearNuxt();
            });

            test("render is works", async () => {
                const html = await get("/");
                expect(html).toContain("Test Page :)");
            });
            test("Sentry is not initialized", async () => {
                expect(addTemplate).toBeDefined();
                const options = getTemplateOptionsFromMock();
                expect(options).toBeNull();

                const window = await nuxt.renderAndGetWindow(url("/"));
                expect(window.$nuxt.$sentry).toBeUndefined();
            });
        });

        describe("options.sentry is set", () => {
            beforeAll(async () => {
                await initNuxt(
                    Object.assign({}, config, {
                        modules: [["@@"]],
                        sentry: {
                            dsn: "https://dsn@sentry.io/jest",
                            environment: "ENVIRONMENT_FROM_JEST",
                            release: "RELEASE_FROM_JEST"
                        }
                    })
                );
            });
            afterAll(async () => {
                await clearNuxt();
            });

            test("render is works", async () => {
                const html = await get("/");
                expect(html).toContain("Test Page :)");
            });
            test("values in options are set to options", () => {
                expect(addTemplate).toBeDefined();
                const options = getTemplateOptionsFromMock();
                expect(options.disabled).toBeFalsy();
                expect(options.dsn.toString()).toEqual("https://dsn@sentry.io/jest");
                expect(options.environment.toString()).toEqual("ENVIRONMENT_FROM_JEST");
                expect(options.release.toString()).toEqual("RELEASE_FROM_JEST");
            });
        });

        describe("moduleOptions is set", () => {
            beforeAll(async () => {
                await initNuxt(
                    Object.assign({}, config, {
                        modules: [
                            [
                                "@@",
                                {
                                    dsn: "https://dsn@sentry.io/jest",
                                    environment: "ENVIRONMENT_FROM_JEST",
                                    release: "RELEASE_FROM_JEST"
                                }
                            ]
                        ]
                    })
                );
            });
            afterAll(async () => {
                await clearNuxt();
            });

            test("render is works", async () => {
                const html = await get("/");
                expect(html).toContain("Test Page :)");
            });
            test("values in moduleOptions are set to options", () => {
                expect(addTemplate).toBeDefined();
                const options = getTemplateOptionsFromMock();
                expect(options.disabled).toBeFalsy();
                expect(options.dsn.toString()).toEqual("https://dsn@sentry.io/jest");
                expect(options.environment.toString()).toEqual("ENVIRONMENT_FROM_JEST");
                expect(options.release.toString()).toEqual("RELEASE_FROM_JEST");
            });
        });

        describe("values in process.env are set to options as default", () => {
            beforeAll(async () => {
                process.env.SENTRY_DISABLED = false;
                process.env.SENTRY_DSN = TEST_DSN;
                process.env.SENTRY_ENVIRONMENT = "ENVIRONMENT_FROM_JEST";
                process.env.SENTRY_RELEASE = "RELEASE_FROM_JEST";

                await initNuxt(config);
            });
            afterAll(async () => {
                await clearNuxt();

                delete process.env.SENTRY_DISABLED;
                delete process.env.SENTRY_DSN;
                delete process.env.SENTRY_ENVIRONMENT;
                delete process.env.SENTRY_RELEASE;
            });

            test("render is works", async () => {
                const html = await get("/");
                expect(html).toContain("Test Page :)");
            });
            test("Sentry is not initialized", async () => {
                expect(addTemplate).toBeDefined();
                const options = getTemplateOptionsFromMock();

                expect(options.disabled).toBeFalsy();
                expect(options.dsn.toString()).toEqual(TEST_DSN);
                expect(options.environment.toString()).toEqual("ENVIRONMENT_FROM_JEST");
                expect(options.release.toString()).toEqual("RELEASE_FROM_JEST");
            });
        });
    });

    describe("plugin", async () => {
        beforeAll(async () => {
            await initNuxt(config);
        });
        afterAll(async () => {
            await clearNuxt();
        });

        test("$sentry is injected", async () => {
            const window = await nuxt.renderAndGetWindow(url("/"));
            const $sentry = window.$nuxt.$sentry;
            expect($sentry).toBeDefined();
        });

        describe("$env", () => {
            beforeEach(() => {
                // 'SENTRY_DSN' is necessary to work
                process.env.SENTRY_DSN = TEST_DSN;
            });
            afterEach(() => {
                // unset all environments
                delete process.env.SENTRY_DISABLED;
                delete process.env.SENTRY_DSN;
                delete process.env.SENTRY_ENVIRONMENT;
                delete process.env.SENTRY_RELEASE;
            });

            test("$env is injected", async () => {
                const window = await nuxt.renderAndGetWindow(url("/"));
                const $env = window.$nuxt.$env;
                expect($env).toBeDefined();
            });

            describe("SENTRY_DISABLED", () => {
                test("should be undefined as default", async () => {
                    const window = await nuxt.renderAndGetWindow(url("/"));
                    expect(window.$nuxt.$env.SENTRY_DISABLED).toBeUndefined();
                });
                test("should be set via process.env", async () => {
                    process.env.SENTRY_DISABLED = true;

                    const window = await nuxt.renderAndGetWindow(url("/"));
                    expect(window.$nuxt.$env.SENTRY_DISABLED).toBeTruthy();
                });
            });

            describe("SENTRY_DSN", () => {
                test("should be undefined as default", async () => {
                    delete process.env.SENTRY_DSN;

                    const window = await nuxt.renderAndGetWindow(url("/"));
                    expect(window.$nuxt.$env.SENTRY_DSN).toBeUndefined();
                });
                test("should be set via process.env", async () => {
                    process.env.SENTRY_DSN = TEST_DSN;

                    const window = await nuxt.renderAndGetWindow(url("/"));
                    expect(window.$nuxt.$env.SENTRY_DSN).toEqual(TEST_DSN);
                });
            });

            describe("SENTRY_ENVIRONMENT", () => {
                test("should be undefined as default", async () => {
                    const window = await nuxt.renderAndGetWindow(url("/"));
                    expect(window.$nuxt.$env.SENTRY_ENVIRONMENT).toBeUndefined();
                });
                test("should be set via process.env", async () => {
                    process.env.SENTRY_ENVIRONMENT = "environment_from_jest";

                    const window = await nuxt.renderAndGetWindow(url("/"));
                    expect(window.$nuxt.$env.SENTRY_ENVIRONMENT).toEqual(
                        "environment_from_jest"
                    );
                });
            });

            describe("SENTRY_RELEASE", () => {
                test("should be undefined as default", async () => {
                    const window = await nuxt.renderAndGetWindow(url("/"));
                    expect(window.$nuxt.$env.SENTRY_RELEASE).toBeUndefined();
                });
                test("should be set via process.env", async () => {
                    process.env.SENTRY_RELEASE = "release_from_jest";

                    const window = await nuxt.renderAndGetWindow(url("/"));
                    expect(window.$nuxt.$env.SENTRY_RELEASE).toEqual("release_from_jest");
                });
            });
        });
    });
});
