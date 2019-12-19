/* eslint-disable no-console */
const debug: boolean = Boolean(process.env.DEBUG) && `${process.env.DEBUG}` === 'true';

export const log = (...args: any): void => {
  if (debug) {
    console.log(...args);
  }
};
