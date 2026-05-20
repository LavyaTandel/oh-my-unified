import fs from 'node:fs';
try {
  const content = fs.readFileSync('./dist/index.js', 'utf8');
  console.log("Read successfully! Length:", content.length);
} catch (err) {
  console.error("Read failed:", err);
}
