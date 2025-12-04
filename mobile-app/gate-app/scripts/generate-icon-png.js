// Generate PNG icon from SVG using available tools
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
const svgPath = path.join(assetsDir, 'icon-template.svg');
const iconPath = path.join(assetsDir, 'icon.png');
const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
  console.error('SVG template not found. Run generate-icon.js first.');
  process.exit(1);
}

// Try different conversion methods
let converted = false;

// Method 1: Try using qlmanage (macOS)
try {
  console.log('Attempting to convert using qlmanage...');
  execSync(`qlmanage -t -s 1024 -o "${assetsDir}" "${svgPath}"`, { stdio: 'ignore' });
  const qlOutput = path.join(assetsDir, 'icon-template.svg.png');
  if (fs.existsSync(qlOutput)) {
    fs.renameSync(qlOutput, iconPath);
    fs.copyFileSync(iconPath, adaptiveIconPath);
    converted = true;
    console.log('✓ Icon converted successfully using qlmanage');
  }
} catch (e) {
  // qlmanage failed, try next method
}

// Method 2: Try using sips (macOS)
if (!converted) {
  try {
    console.log('Attempting to convert using sips...');
    // sips doesn't directly support SVG, so we'll need another approach
    console.log('sips doesn\'t support SVG directly');
  } catch (e) {
    // sips failed
  }
}

if (!converted) {
  console.log('\n⚠️  Automatic conversion failed.');
  console.log('Please convert the SVG manually:');
  console.log(`  SVG: ${svgPath}`);
  console.log('  Output: icon.png and adaptive-icon.png (1024x1024 PNG)');
  console.log('\nYou can use:');
  console.log('  - Online: https://convertio.co/svg-png/');
  console.log('  - ImageMagick: brew install imagemagick && convert icon-template.svg -resize 1024x1024 icon.png');
  console.log('  - Inkscape: brew install inkscape && inkscape --export-png=icon.png --export-width=1024 icon-template.svg');
}

