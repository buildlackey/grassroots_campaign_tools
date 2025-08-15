// code/ui/test/raw/mocks_gas.js
// Compatibility shim: keep the same import used by tests,
// but delegate to the unified mock in setupMock.js.

const { setupMock } = require("./setupMock");

function installMockGoogleScript(window) {
  // Idempotency: if already installed, skip
  if (window?.google?.script?.run?.withSuccessHandler) return;
  setupMock(window);
}

module.exports = { installMockGoogleScript };
