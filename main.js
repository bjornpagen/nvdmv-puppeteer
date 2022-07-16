"use strict";

const Timeslots = {
  EightAM: '08:00 am',
  EightFifteenAM: '08:15 am',
  EightThirtyAM: '08:30 am',
  EightFortyFiveAM: '08:45 am',
  NineAM: '09:00 am',
  NineFifteenAM: '09:15 am',
  NineThirtyAM: '09:30 am',
  NineFortyFiveAM: '09:45 am',
  TenAM: '10:00 am',
  TenFifteenAM: '10:15 am',
  TenThirtyAM: '10:30 am',
  TenFortyFiveAM: '10:45 am',
  ElevenAM: '11:00 am',
  ElevenFifteenAM: '11:15 am',
  ElevenThirtyAM: '11:30 am',
  ElevenFortyFiveAM: '11:45 am',
  TwelvePM: '12:00 pm',
  TwelveFifteenPM: '12:15 pm',
  TwelveThirtyPM: '12:30 pm',
  TwelveFortyFivePM: '12:45 pm',
  OnePM: '01:00 pm',
  OneFifteenPM: '01:15 pm',
  OneThirtyPM: '01:30 pm',
  OneFortyFivePM: '01:45 pm',
  TwoPM: '02:00 pm',
  TwoFifteenPM: '02:15 pm',
  TwoThirtyPM: '02:30 pm',
  TwoFortyFivePM: '02:45 pm',
  ThreePM: '03:00 pm',
  ThreeFifteenPM: '03:15 pm',
  ThreeThirtyPM: '03:30 pm',
  ThreeFortyFivePM: '03:45 pm',
  FourPM: '04:00 pm',
  FourFifteenPM: '04:15 pm',
  FourThirtyPM: '04:30 pm'
}

const Branches = {
  CarsonCity: 'Carson City',
  Decatur: 'Decatur',
  Flamingo: 'Flamingo',
  Henderson: 'Henderson',
  Sahara: 'Sahara',
  SouthReno: 'SouthReno'
}

const Services = {
  ADA: 'ADA',
  DriversLicenseRenewal: 'Drivers License  - Renewal',
  DriversLicenseNew: 'Drivers License - New',
  KnowledgeWrittenTesting: 'Knowledge/ Written Testing',
  LicensePlatePickupDropoff: 'License Plate Pickup\Dropoff',
  MultipleTransactions: 'Multiple Transactions (DL & Registration)',
  RegistrationNew: 'Registration - New',
  RegistrationTitle: 'Registration - Title',
  SuspensionsLicenseRecovery: 'Suspensions (Reinstatements) - Driver License/Revenue Recovery',
  SuspensionsRegistrationRecovery: 'Suspensions (Reinstatements) - Registration/Revenue Recovery',
}

const localBranchName = Branches.Decatur;
const serviceName = Services.DriversLicenseNew;
const dayToBook = `28`;
const timesToIgnore = [Timeslots.TwelveThirtyPM];

async function evalElem(element) {
  const value = await element.evaluate(el => el.textContent);
  return value;
}

// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  // returns the elem associated with dayToBook, otherwise returns -1
  async function tryDay(day) {
    const page = await browser.newPage();
    await page.goto('https://dmvapp.nv.gov/qmaticwebbooking/#/');
    await page.waitForTimeout(10000);

    const localBranch = (await page.$x(`//div[text()="${localBranchName}"]`))[0];
    await localBranch.click();
    await page.waitForTimeout(200);

    const serviceInput = (await page.$x(`//label[text()="${serviceName}"]/..//input[@type="radio"]`))[0];
    await serviceInput.click();
    await page.waitForTimeout(200);

    const dateDropdown = (await page.$x(`//div[text()="Select date and time"]`))[0];
    await dateDropdown.click();
    await page.waitForTimeout(200);

    const availableDays = (await page.$x(`//li[@webid="dateTimeSelectionStep"]//table//button[not(@disabled)]`));
    const availableDayVals = await Promise.all(availableDays.map(evalElem));
    const index = availableDayVals.indexOf(dayToBook);
    if (index === -1) {
      return tryDay(day);
    }
    return [page, availableDays[index]];
  }

  async function tryTime(bad_times) {
    const [page, availableDayToBook] = await tryDay(dayToBook);
    await availableDayToBook.click();
    await page.waitForTimeout(200);

    const timeSlots = (await page.$x(`//div[@class="timeslots"]//button`));
    const timeSlotVals = await Promise.all(timeSlots.map(evalElem));
    for (const time in Timeslots) {
      const i = timeSlotVals.indexOf(Timeslots[time]);
      const j = bad_times.indexOf(Timeslots[time]);
      if (i !== -1 && j === -1) {
        return [page, timeSlots[i]];
      }
    }

    return tryTime(bad_times);
  }

  const [page, availableTime] = await tryTime(timesToIgnore);
  await availableTime.click();
  await page.waitForTimeout(200);

  await page.screenshot({ path: 'testresult.png', fullPage: true });
  await browser.close();
  console.log(`All done, check the screenshot.`);
})