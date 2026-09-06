import { Router } from "express";
import { v4 as uuid } from "uuid";
import { pool, memoryAssetRowToContract } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const memoryAssetsRouter = Router();
memoryAssetsRouter.use(requireAuth);

// GET /api/patients/:id/memory-assets
memoryAssetsRouter.get("/:id/memory-assets", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM memory_assets WHERE patient_id = $1 ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json(rows.map(memoryAssetRowToContract));
});

// POST /api/patients/:id/memory-assets
// body: { type, url, tags, uploaded_by }
// Used by Person 1 ("Still Useful" recordings) and Person 2 (music library links).
memoryAssetsRouter.post("/:id/memory-assets", async (req, res) => {
  const { type, url, tags, uploaded_by } = req.body || {};
  const validTypes = ["photo", "voice", "music"];
  if (!validTypes.includes(type) || !url || !uploaded_by) {
    return res.status(400).json(errorBody("type, url, and uploaded_by are required/invalid", "VALIDATION_ERROR"));
  }

  const asset = {
    id: uuid(),
    patient_id: req.params.id,
    type,
    url,
    tags: JSON.stringify(tags ?? []),
    uploaded_by,
    created_at: new Date().toISOString(),
  };

  await pool.query(
    `INSERT INTO memory_assets (id, patient_id, type, url, tags, uploaded_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [asset.id, asset.patient_id, asset.type, asset.url, asset.tags, asset.uploaded_by, asset.created_at]
  );

  res.status(201).json(memoryAssetRowToContract(asset));
});
