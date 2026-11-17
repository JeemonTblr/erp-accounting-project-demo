const axios = require("axios");
const { erpNextConfig, getErpNextAuthHeader } = require("../../config/erpnext.config");
const erpNextClient = axios.create({
  baseURL: erpNextConfig.baseUrl,
  timeout: erpNextConfig.timeout,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});
erpNextClient.interceptors.request.use((reqConfig) => {
  const authHeader = getErpNextAuthHeader();
  if (authHeader) {
    reqConfig.headers["Authorization"] = authHeader;
  }
  return reqConfig;
});
erpNextClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const frappe = error.response?.data;
    let message = `ERPNext API Error ${status ?? "NETWORK"}`;
    if (frappe?._server_messages) {
      try {
        const parsed = JSON.parse(frappe._server_messages);
        const inner = JSON.parse(parsed[0]);
        message = inner.message ?? message;
      } catch {
        message = frappe._server_messages;
      }
    } else if (frappe?.exception) {
      message = frappe.exception;
    } else if (frappe?.message) {
      message = frappe.message;
    } else if (error.message) {
      message = error.message;
    }
    const enrichedError = new Error(message);
    enrichedError.statusCode = status ?? 503;
    return Promise.reject(enrichedError);
  }
);
const submitFrappeDoc = async (doctype, name) => {
  await erpNextClient.post(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    docstatus: 1
  });
};
const pingErpNext = async () => {
  try {
    await erpNextClient.get("/api/method/frappe.auth.get_logged_user");
    return { ok: true, message: "ERPNext connection successful." };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, message: `ERPNext unreachable: ${msg}` };
  }
};
module.exports = {
  erpNextClient,
  pingErpNext,
  submitFrappeDoc,
};
