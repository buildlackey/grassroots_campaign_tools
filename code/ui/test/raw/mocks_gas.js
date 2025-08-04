window.SpreadsheetApp = {
  getUi: () => ({
    alert: (msg) => console.log("ALERT:", msg),
    showModalDialog: () => {},
    createMenu: () => ({ addItem: () => {}, addToUi: () => {} }),
  }),
};

window.google = {
  script: {
    run: {
      withSuccessHandler(cb) {
        return {
          getSheetTabNames: () => cb(["MockSheet1", "MockSheet2"]),
          getHeadersForSheet: (name) =>
            cb({ headers: ["Street", "City", "Zip"] }),
          savePreferences: (prefs) =>
            console.log("💾 Saved preferences", prefs),
        };
      },
      withFailureHandler(cb) {
        return this;
      },
    },
    host: {
      close: () => console.log("🔒 Dialog closed"),
    },
  },
};

