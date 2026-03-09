import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Browser service worker instance.
 * Started in main.tsx only during development when USE_MOCK is false.
 */
export const worker = setupWorker(...handlers);
