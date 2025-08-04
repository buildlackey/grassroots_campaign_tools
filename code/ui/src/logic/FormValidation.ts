const FormValidation = {
  MESSAGE: "Injected via include",
  hello() : string {
      return "👋 cheap goods  zee  boo foo doo china roo from FormValidation.hello()";
  },
  validateForm(data: any) {
    return { valid: false, errors: ["Still a placeholder"] };
  }
};

