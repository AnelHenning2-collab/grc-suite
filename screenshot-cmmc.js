const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const htmlPath = 'file:///' + path.resolve('cmmc-gap-assessment.html').replace(/\\/g, '/');
  const outDir = path.resolve('cmmc-jpgs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const WIDTH = 960, SLICE_H = 1280;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: WIDTH, height: SLICE_H, deviceScaleFactor: 2 });
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.addStyleTag({ content: '.no-print { display: none !important; }' });

  const fullHeight = await page.evaluate(() => document.body.scrollHeight);
  const pages = Math.ceil(fullHeight / SLICE_H);
  console.log(`Height: ${fullHeight}px → ${pages} slices`);

  await page.setViewport({ width: WIDTH, height: fullHeight, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(outDir,'cmmc-FULL.jpg'), type:'jpeg', quality:95, fullPage:false });
  console.log('✓ FULL');

  for (let i = 0; i < pages; i++) {
    const y = i * SLICE_H;
    const h = Math.min(SLICE_H, fullHeight - y);
    const file = path.join(outDir, `cmmc-p${String(i+1).padStart(2,'0')}.jpg`);
    await page.screenshot({ path: file, type:'jpeg', quality:95, clip:{ x:0, y, width:WIDTH, height:h } });
    console.log(`✓ Page ${i+1}/${pages}`);
  }

  await browser.close();
  console.log('Done → ' + outDir);
})();
