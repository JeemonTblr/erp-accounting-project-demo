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

module.exports = pluginRoute;

