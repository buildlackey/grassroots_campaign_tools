class HelloSvc {
  static ping(): string {
    return "HELLO_LOGIC_OK";
  }
}

// Export into GAS global namespace
(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};
(globalThis as any).CAMPAIGN.HelloSvc = HelloSvc;
