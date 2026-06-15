import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { Settings } from '../models/Settings.model';

// Helper to get or create settings
async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

// ─────────────────────────────────────────────
// GET /api/settings
// ─────────────────────────────────────────────
export const getSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getSettings();
  res.status(200).json(
    ApiResponse.success('Settings retrieved successfully', settings.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// PUT /api/settings
// ─────────────────────────────────────────────
export const updateSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getSettings();
  
  // Update fields from body
  const updateData = req.body;
  Object.assign(settings, updateData);
  
  await settings.save();
  
  res.status(200).json(
    ApiResponse.success('Settings updated successfully', settings.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/settings/reset
// ─────────────────────────────────────────────
export const resetSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getSettings();
  
  // Overwrite with defaults by recreating the document
  await Settings.deleteMany({});
  const newSettings = await Settings.create({});
  
  res.status(200).json(
    ApiResponse.success('Settings reset to defaults successfully', newSettings.toJSON()).toJSON()
  );
});
