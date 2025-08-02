// ui/src/FormValidation.global.ts
import { FormValidation } from "./FormValidation";

// GAS-safe global exposure
(globalThis as any).FormValidation = FormValidation;

export { FormValidation };

