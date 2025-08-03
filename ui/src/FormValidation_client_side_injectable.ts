const FormValidation_client_side_injectable = {
  MESSAGE: "Injected via include",
  hello() : string {
      return "👋 texico from FormValidation_client_side_injectable.hello()";
  },
  validateForm(data: any) {
    return { valid: false, errors: ["Still a placeholder"] };
  }
};

