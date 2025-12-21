import { Router } from "express";
import path from "path";
import fs from "fs";

const router = Router();

// Serve profile images
router.get("/profile/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.sendFile(filePath);
});

export default router;
