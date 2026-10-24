import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const publicDir = path.resolve('public');
const srcImage = path.join(
  publicDir,
  'assets',
  'aistudio',
  'Gemini_Generated_Image_6j83cw6j83cw6j83_929f5ccc.jpg'
);

if (fs.existsSync(srcImage)) {
  try {
    execFileSync('convert', [srcImage, '-resize', '180x180', `PNG32:${path.join(publicDir, 'apple-touch-icon.png')}`]);
    execFileSync('convert', [srcImage, '-resize', '192x192', `PNG32:${path.join(publicDir, 'pwa-192x192.png')}`]);
    execFileSync('convert', [srcImage, '-resize', '512x512', `PNG32:${path.join(publicDir, 'pwa-512x512.png')}`]);
    execFileSync('convert', [srcImage, '-resize', '512x512', `PNG32:${path.join(publicDir, 'pwa-maskable-512x512.png')}`]);
    execFileSync('convert', [srcImage, '-define', 'icon:auto-resize=64,48,32,16', path.join(publicDir, 'favicon.ico')]);

    const b64 = fs.readFileSync(path.join(publicDir, 'pwa-512x512.png')).toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">\n  <image href="data:image/png;base64,${b64}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid slice" />\n</svg>\n`;
    fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf8');
    console.log('Successfully generated PWA icon set from uploaded image!');
  } catch (err) {
    console.warn('Could not run convert, keeping existing public icons:', err.message);
  }
} else {
  console.log('Keeping existing public icons.');
}
