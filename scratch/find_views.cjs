const fs = require('fs');
const content = fs.readFileSync('client/dist/index.html', 'utf8');
const lines = content.split('\n');

const viewFunctions = [];
lines.forEach((l, idx) => {
  const m = l.match(/function\s+([A-Za-z0-9_]+View)\s*\(/);
  if (m) {
    viewFunctions.push({ line: idx + 1, name: m[1] });
  }
});

console.log('Views found:', viewFunctions);
