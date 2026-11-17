const { config } = require("./env");
const erpNextConfig = {
  baseUrl: config.erpnext.baseUrl,
  apiKey: config.erpnext.apiKey,
  apiSecret: config.erpnext.apiSecret,
  company: config.erpnext.company,
  timeout: 15e3
};
const getErpNextAuthHeader = () => {
  if (erpNextConfig.apiKey && erpNextConfig.apiSecret) {
    return `token ${erpNextConfig.apiKey}:${erpNextConfig.apiSecret}`;
  }
  return "";
};
module.exports = {
  erpNextConfig,
  getErpNextAuthHeader,
};
