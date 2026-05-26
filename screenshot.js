const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const htmlPath = 'file:///' + path.resolve('sunshine-dental-case-study.html').replace(/\\/g, '/');
  const outDir = path.resolve('sunshine-dental-jpgs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 960px wide = good portrait document width, high DPI
  await page.setViewport({ width: 960, height: 1280, deviceScaleFactor: 2 });
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for fonts
  await new Promise(r => setTimeout(r, 2000));

  // Hide print button
  await page.addStyleTag({ content: '.no-print { display: none !important; }' });

  // Get full page height
  const fullHeight = await page.evaluate(() => document.body.scrollHeight);
  const pageH = 1280; // slice height in CSS px
  const pages = Math.ceil(fullHeight / pageH);

  console.log(`Full height: ${fullHeight}px — generating ${pages} JPGs...`);

  for (let i = 0; i < pages; i++) {
    const scrollY = i * pageH;
    await page.evaluate(y => window.scrollTo(0, y), scrollY);
    await new Promise(r => setTimeout(r, 300));

    const filename = path.join(outDir, `sunshine-dental-p${String(i + 1).padStart(2, '0')}.jpg`);
    await page.screenshot({
      path: filename,
      type: 'jpeg',
      quality: 95,
      clip: { x: 0, y: scrollY, width: 960, height: Math.min(pageH, fullHeight - scrollY) }
    });
    console.log(`  ✓ Page ${i + 1}/${pages} → ${path.basename(filename)}`);
  }

  // Also save one full-length version
  const fullFile = path.join(outDir, 'sunshine-dental-FULL.jpg');
  await page.setViewport({ width: 960, height: fullHeight, deviceScaleFactor: 2 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: fullFile, type: 'jpeg', quality: 95, fullPage: true });
  console.log(`  ✓ Full page → ${path.basename(fullFile)}`);

  await browser.close();
  console.log(`\nDone! JPGs saved to: ${outDir}`);
})();
