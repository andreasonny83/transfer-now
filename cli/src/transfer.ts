import { put } from './put';
import { log } from './log';
import { get } from './get';
import { list } from './list';
import { link } from './link';
import { GENERIC_ERROR } from './constants';

const enum ACTION {
  PUT = 'put',
  GET = 'get',
  LIST = 'list',
  LS = 'ls',
  LINK = 'link',
}

type Flags = {
  silent?: boolean;
  targetDir?: string;
  targetFilename?: string;
};

export const transfer = async (action: ACTION, name: string, flags: Flags): Promise<void> => {
  const { silent, targetDir, targetFilename } = flags;

  if (action === ACTION.PUT) {
    let fileEndpoint;
    try {
      fileEndpoint = await put(name, silent);
    } catch (err: any) {
      log(silent, err.message || err);
      process.exit(1);
    }

    if (!silent) {
      log(silent, `File available at: ${fileEndpoint}`);
      log(silent, `You can now download from your terminal with\n\n  $ transfer-now get ${fileEndpoint}\n\n`);
    }
    return process.exit(0);
  }

  if (action === ACTION.GET) {
    let filePath: string;
    try {
      filePath = await get(name, targetDir, targetFilename);
    } catch (err: any) {
      log(silent, (err && err.message) || GENERIC_ERROR);
      process.exit(1);
    }

    if (!filePath) {
      log(silent, GENERIC_ERROR);
    }

    log(silent, `File saved to ${filePath}`);
    return process.exit(0);
  }

  if (action === ACTION.LIST || action === ACTION.LS) {
    let listFiles;
    try {
      listFiles = await list(silent);
    } catch (err: any) {
      log(silent, (err && err.message) || GENERIC_ERROR);
      process.exit(1);
    }

    if (!listFiles) {
      log(silent, GENERIC_ERROR);
    }

    log(silent, listFiles);
    return process.exit(0);
  }

  if (action === ACTION.LINK) {
    let linkUrl: string;
    try {
      linkUrl = await link(name, silent);
    } catch (err: any) {
      log(silent, (err && err.message) || GENERIC_ERROR);
      process.exit(1);
    }

    if (!linkUrl) {
      log(silent, GENERIC_ERROR);
    }

    log(silent, `One-ime URL genereated:\n\n  ${linkUrl}\n`);
    process.exit(0);
  }

  log(silent, `Method not allowed ${action}. Try running transfer-now --help for more information`);
  return process.exit(1);
};
