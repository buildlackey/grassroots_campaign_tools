class HelloSvc {
  static ping(): string {
    return "HELLO_LOGIC_OK";
  }
}

// Export into GAS global namespace
(globalThis as any).CAMPAIGN_TOOLS = (globalThis as any).CAMPAIGN_TOOLS || {};
(globalThis as any).CAMPAIGN_TOOLS.HelloSvc = HelloSvc;
