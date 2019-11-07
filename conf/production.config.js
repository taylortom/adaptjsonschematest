module.exports = {
  'adapt-authoring-logger': {
    enabledLevels: ["error", "warn", "info"],
  },
  'adapt-authoring-server': {
    host: "localhost",
    port: Number(process.env.PORT),
    url: 'https://adapt-jsonschema.herokuapp.com/'
  }
};
