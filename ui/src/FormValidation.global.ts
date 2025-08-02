
// This file wraps FormValidation.ts and exposes it for Webpack


import { FormValidation } from "./FormValidation";

// GAS-safe global exposure
(globalThis as any).FormValidation = FormValidation;

export { FormValidation };

