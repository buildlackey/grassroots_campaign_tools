interface GreetingOptions {
  name?: string;
}

export const LatLong = {
  greetWithOptions(opts: GreetingOptions = {}) {
    const name = opts.name ?? "stranger";
    SpreadsheetApp.getUi().alert(`👋 Greetings, ${name}`);
  },

  helloLatLong(message: string = "defaulto") {
    SpreadsheetApp.getUi().alert("👋 Hello from " + message);
  }
};

// 👇 Tell GAS to expose it globally
(globalThis as any).LatLong = LatLong;

