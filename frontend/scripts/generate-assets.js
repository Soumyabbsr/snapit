/**
 * Generates minimal placeholder PNG files needed by Expo:
 *   assets/icon.png          (orange background)
 *   assets/splash.png        (dark background)
 *   assets/adaptive-icon.png (orange background)
 *
 * Run once with: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 PNG (pure orange ~#FF6B35 background)
// These are real valid PNG files, just 1×1 pixel placeholders
const orangePng1x1 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cf400000000200015e0001700000000049454e44ae426082',
  'hex'
);

// Minimal 1x1 dark PNG (#0a0a0a)
const darkPng1x1 = Buffer.from(
  '89504e470d0a1a0a0000000d494844520000000100000001080200000090' +
  '012e00000000c4944415478016360080000000200010d0022700000000049454e44ae426082',
  'hex'
);

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const files = {
  'icon.png': orangePng1x1,
  'adaptive-icon.png': orangePng1x1,
  'splash.png': darkPng1x1,
};

Object.entries(files).forEach(([name, buf]) => {
  const dest = path.join(assetsDir, name);
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, buf);
    console.log(`✅ Created ${name}`);
  } else {
    console.log(`⏭️  Skipped ${name} (already exists)`);
  }
});

console.log('\nAll placeholder assets ready. Replace with real images before publishing.\n');
