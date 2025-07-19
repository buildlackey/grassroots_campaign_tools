interface GreetingOptions {
  name?: string;
}

export function greetWithOptions(opts: GreetingOptions = {}): void {
  const name = opts.name ?? "stranger";
  SpreadsheetApp.getUi().alert(`👋 Greetings, ${name}`);
}

