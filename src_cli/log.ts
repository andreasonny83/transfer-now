/* eslint-disable no-console */
export const log = (silent = false, ...args: any): void => {
  if (!silent) {
    console.log(...args);
  }
};
