/* eslint-disable no-console */
const debug: boolean = Boolean(process.env.DEBUG) || false;

export const log = (...args: any): void => {
  if (debug) {
    console.log(...args);
  }
};
