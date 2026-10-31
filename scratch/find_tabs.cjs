const fs = require('fs');
const content = fs.readFileSync('client/dist/index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('{/* TAB') || (l.includes('monitorTab ===') && i > 3700 && i < 4600)) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
