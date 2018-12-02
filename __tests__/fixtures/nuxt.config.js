module.exports = {
  srcDir: __dirname,
  dev: false,
  render: {
    resourceHints: false
  },
  modules: [
    [
      "@@",
      {
          environment: "test-from-jest",
          release: "TEST_VERSION_RELEASE"
      }
    ]
  ]
};
