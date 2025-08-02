// src/FormValidation.ts

export const FormValidation = {
  MESSAGE: "big hello from FormValidation",

  validateForm(_: Record<string, any>) {
    return {
      valid: false,
      errors: ["❌ Validation failed (placeholder response)."],
    };
  },
};

