import { put } from './put';
import { log } from './log';

enum ACTION {
  PUT = 'put',
  GET = 'get',
  LIST = 'list',
  LOGIN = 'login'
}

type Flags = {
  silent?: boolean;
};

export const transfer = async (
  action: ACTION,
  name: string,
  flags: Flags
): Promise<void> => {
  const { silent } = flags;

  if (action === ACTION.PUT) {
    let fileEndpoint;
    try {
      fileEndpoint = await put(name, silent);
    } catch (err) {
      log(silent, err.message || err);
      process.exit(1);
    }

    if (!silent) {
      log(silent, `File available at: ${fileEndpoint}`);
      log(
        silent,
        `You can now download from your terminal with\n\n  $ transfer-now get ${fileEndpoint}\n\n`
      );
    }
    return process.exit(0);
  }

  if (action === ACTION.GET) {
    log(silent, 'Method not yet available. Try again in the future');
    return process.exit(0);
  }

  if (action === ACTION.LIST) {
    log(silent, 'Method "get" not yet available. Try again in the future');
    return process.exit(0);
  }

  if (action === ACTION.LOGIN) {
    log(silent, 'Method "get" not yet available. Try again in the future');
    return process.exit(0);
  }

  log(
    silent,
    `Method not allowed ${action}. Try running transfer-now --help for more information`
  );
  return process.exit(1);
};
