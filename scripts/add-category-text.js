const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Try to register Playfair Display if available, otherwise use serif
try {
  // Download and register Playfair Display font
  const fontPath = path.join(__dirname, 'PlayfairDisplay-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: 'Playfair Display' });
  }
} catch (e) {
  console.log('Using default serif font');
}

const images = [
  {
    input: '/workspaces/nova-style/Redesign assets/Kategorie-damskie/Płaszcze D.png',
    output: '/workspaces/nova-style/storefront/public/images/categories/plaszcze.png',
    text: 'PŁASZCZE'
  },
  {
    input: '/workspaces/nova-style/Redesign assets/Kategorie-damskie/Legginsy D.png',
    output: '/workspaces/nova-style/storefront/public/images/categories/legginsy.png',
    text: 'LEGGINSY'
  },
  {
    input: '/workspaces/nova-style/Redesign assets/Kategorie-damskie/Marynarki D.png',
    output: '/workspaces/nova-style/storefront/public/images/categories/marynarki.png',
    text: 'MARYNARKI'
  },
  {
    input: '/workspaces/nova-style/Redesign assets/Kategorie-meskie/Marynarki M.png',
    output: '/workspaces/nova-style/storefront/public/images/categories/marynarki-men.png',
    text: 'MARYNARKI'
  },
  {
    input: '/workspaces/nova-style/Redesign assets/Kategorie-meskie/Płaszcze M.png',
    output: '/workspaces/nova-style/storefront/public/images/categories/plaszcze-men.png',
    text: 'PŁASZCZE'
  }
];

async function addTextToImage(inputPath, outputPath, text) {
  const image = await loadImage(inputPath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  // Draw original image
  ctx.drawImage(image, 0, 0);

  // Calculate font size based on image width (approximately 12% of width to match existing images)
  const fontSize = Math.round(image.width * 0.12);

  // Set font - Playfair Display style (serif, slightly condensed letter spacing)
  ctx.font = `${fontSize}px "Playfair Display", "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Position text in center of image
  const x = image.width / 2;
  const y = image.height / 2;

  // Add subtle shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw white text
  ctx.fillStyle = 'white';
  ctx.letterSpacing = '3px';
  ctx.fillText(text, x, y);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Created: ${outputPath}`);
}

async function main() {
  for (const img of images) {
    try {
      await addTextToImage(img.input, img.output, img.text);
    } catch (e) {
      console.error(`Error processing ${img.input}:`, e.message);
    }
  }
  console.log('Done!');
}

main();
