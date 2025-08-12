// Global ambient type declarations
// Extiende window para incluir currentUser utilizado en varias vistas

import type { User } from './index';

declare global {
  interface Window {
    currentUser?: User;
  }
}

export {};
