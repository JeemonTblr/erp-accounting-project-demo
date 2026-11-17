"use strict";

/**
 * Plugin Routes — /api/plugins/accounting/*
 * Exposes health status and manifest for the accounting plugin.
 */

const { Router } = require("express");
const path = require("path");
const { AccountingAdapter } = require("./index");

const pluginRoute = Router();

/**
 * GET /api/plugins/accounting/status
 * Returns live health ping of both ERPNext and EAccounting providers.
 */
pluginRoute.get("/status", async (req, res, next) => {
  try {
    const status = await AccountingAdapter.getPluginStatus();
    res.status(200).json({
      success: true,
      ...status,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/plugins/accounting/manifest
 * Returns the plugin manifest descriptor.
 */
pluginRoute.get("/manifest", (req, res, next) => {
  try {
    const manifest = require(path.join(__dirname, "../plugin.manifest.json"));
    res.status(200).json({ success: true, manifest });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/plugins/accounting/manager-modules
 * Lists the modules available in the EAccounting server.
 */
pluginRoute.get("/manager-modules", async (req, res, next) => {
  try {
    const { ManagerAccountingPlugin } = require("./manager-accounting.plugin");
    const plugin = new ManagerAccountingPlugin();
    const modules = await plugin.getModules();
    res.status(200).json({ success: true, modules });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/plugins/accounting/info
 * Returns the currently active provider info.
 */
pluginRoute.get("/info", (req, res) => {
  res.status(200).json({
    success: true,
    active: AccountingAdapter.getActivePluginInfo(),
  });
});

/**
 * Universal Proxy Route — /api/plugins/accounting/proxy/*
 * Forwards any request to the Manager EAccounting API server with required tenant headers.
 */
pluginRoute.all("/proxy/*", async (req, res, next) => {
  try {
    const targetPath = req.params[0] ? `/${req.params[0]}` : req.url.replace(/^\/proxy/, "");
    const { ManagerAccountingPlugin } = require("./manager-accounting.plugin");
    const plugin = new ManagerAccountingPlugin();
    const axios = require("axios");

    const targetUrl = `${plugin.baseUrl}${targetPath.startsWith("/api") ? targetPath : "/api" + targetPath}`;
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": process.env.EACCOUNTING_TENANT_ID || "tenant-demo-01",
        "x-host-app-id": process.env.EACCOUNTING_HOST_APP_ID || "textile-erp",
        "x-user-id": req.user?.id ? String(req.user.id) : "1",
        "x-role": req.user?.role || "admin",
      },
      timeout: 10000,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({
        success: false,
        message: `Failed to connect to Manager Accounting Module: ${error.message}`,
      });
    }
  }
});

module.exports = pluginRoute;

