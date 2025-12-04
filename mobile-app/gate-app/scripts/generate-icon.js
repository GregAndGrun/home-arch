// Simple script to generate app icon
// This creates a simple house/gate icon using Node.js

const fs = require('fs');
const path = require('path');

// For now, we'll create a simple SVG that can be converted
// In production, you'd use a proper image library like sharp or canvas

const svgContent = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle with gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#42A5F5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1976D2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="512" cy="512" r="512" fill="url(#bgGradient)"/>
  
  <!-- House base -->
  <path d="M 512 200 L 280 380 L 280 780 L 744 780 L 744 380 Z" fill="#FFFFFF" stroke="#E3F2FD" stroke-width="24"/>
  
  <!-- Roof -->
  <path d="M 260 380 L 512 200 L 764 380 Z" fill="#FFFFFF"/>
  <line x1="260" y1="380" x2="512" y2="200" stroke="#BBDEFB" stroke-width="24"/>
  <line x1="512" y1="200" x2="764" y2="380" stroke="#BBDEFB" stroke-width="24"/>
  
  <!-- Door/Gate (main feature) -->
  <rect x="440" y="580" width="144" height="200" fill="#2196F3" rx="12" stroke="#1976D2" stroke-width="8"/>
  <circle cx="540" cy="680" r="10" fill="#FFFFFF"/>
  
  <!-- Window left -->
  <rect x="320" y="460" width="100" height="100" fill="#2196F3" rx="12" stroke="#1976D2" stroke-width="6"/>
  <line x1="370" y1="460" x2="370" y2="560" stroke="#FFFFFF" stroke-width="8"/>
  <line x1="320" y1="510" x2="420" y2="510" stroke="#FFFFFF" stroke-width="8"/>
  
  <!-- Window right -->
  <rect x="604" y="460" width="100" height="100" fill="#2196F3" rx="12" stroke="#1976D2" stroke-width="6"/>
  <line x1="654" y1="460" x2="654" y2="560" stroke="#FFFFFF" stroke-width="8"/>
  <line x1="604" y1="510" x2="704" y2="510" stroke="#FFFFFF" stroke-width="8"/>
</svg>`;

const assetsDir = path.join(__dirname, '../assets');
const svgPath = path.join(assetsDir, 'icon-template.svg');

fs.writeFileSync(svgPath, svgContent);
console.log('SVG icon template created at:', svgPath);
console.log('Note: You need to convert this SVG to PNG 1024x1024 for use as app icon.');
console.log('You can use online tools like https://convertio.co/svg-png/ or install ImageMagick/Inkscape');

