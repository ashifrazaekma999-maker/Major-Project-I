import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\india\\Downloads\\netrish\\node_modules';
const destDir = path.resolve('./node_modules');

console.log('Checking source node_modules at:', srcDir);
if (fs.existsSync(srcDir)) {
  console.log('Source exists! Creating symlink or copying...');
  try {
    if (!fs.existsSync(destDir)) {
      fs.symlinkSync(srcDir, destDir, 'junction');
      console.log('Successfully created junction to node_modules!');
    } else {
      console.log('node_modules already exists.');
    }
  } catch (e) {
    console.error('Symlink failed, attempting copy:', e.message);
  }
} else {
  console.log('Source node_modules not found.');
}
