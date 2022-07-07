// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage();
  await page.goto('https://dmvapp.nv.gov/qmaticwebbooking/#/');
  await page.waitForTimeout(5000);
  const localBranchName = `Decatur`;
  const localBranch = (await page.$x(`//div[text()="${localBranchName}"]`))[0];
  await localBranch.click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'testresult.png', fullPage: true });
  await browser.close();
  console.log(`All done, check the screenshot.`);
})