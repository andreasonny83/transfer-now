const put = require('./put');

module.exports = async (action, name, flags) => {
  if (action === 'put') {
    const fileEndpoint = await put(name, flags);
    console.log(`File available at: ${fileEndpoint}`);
    console.log(
      `You can now download from your terminal with\n\n  $ transfer-now get ${fileEndpoint}\n\n`
    );
    return;
  }

  if (action === 'get') {
    console.log('Method "get" not yet available. Try again in the future');
    return process.exit(0);
  }
};
