const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Directory to serve installers from
const downloadsDir = path.join(__dirname, '..', '..', 'downloads');

function getLatestFileByExt(dir, ext) {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(ext.toLowerCase()))
    .map((f) => ({
      name: f,
      fullPath: path.join(dir, f),
      mtimeMs: fs.statSync(path.join(dir, f)).mtimeMs
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files[0] || null;
}

// GET /api/downloads/windows/latest -> serves latest .exe
router.get('/windows/latest', (req, res) => {
  try {
    const latest = getLatestFileByExt(downloadsDir, '.exe');
    if (!latest) {
      return res.status(404).json({ error: 'No Windows installer found' });
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${latest.name}"`);
    return res.download(latest.fullPath);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Failed to download installer' });
  }
});

// Optional: expose simple metadata
router.get('/windows/latest/meta', (req, res) => {
  try {
    const latest = getLatestFileByExt(downloadsDir, '.exe');
    if (!latest) {
      return res.status(404).json({ error: 'No Windows installer found' });
    }
    return res.json({ fileName: latest.name, sizeBytes: fs.statSync(latest.fullPath).size });
  } catch (err) {
    console.error('Meta error:', err);
    return res.status(500).json({ error: 'Failed to read metadata' });
  }
});

module.exports = router;


