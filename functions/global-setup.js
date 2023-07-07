/* eslint-disable */
const { setup: setupDevServer } = require('jest-dev-server')

module.exports = async function globalSetup() {
  globalThis.servers = await setupDevServer({
    command: `yarn start:wrangler`,
  })
  await new Promise((r) => setTimeout(r, 30000))
}