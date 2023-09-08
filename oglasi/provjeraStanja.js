import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import db from "../../db/index.js";

async function stanje() {
  const baza = await db.query(
    `SELECT * FROM oglasi`);
  const items = baza.rows;
  puppeteer.use(StealthPlugin());
  puppeteer
    .launch({
      headless: false,
      executablePath: executablePath(),
    })
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);

      const startIndex = 0; //Od kojeg oglasa krenuti
      for (let i = startIndex; i < items.length; i++) {
        console.log(i);
        const jedan = items[i];
        var link = jedan.link;
        await page.goto(jedan.link);
        await page.waitForSelector("body", {
          visible: true,
        });
        // Captcha
        let captcha
        try {
           captcha = await page.evaluate(
            () =>
              document.querySelector(
                "body > div.container > div:nth-child(3) > center:nth-child(2) > p > b" 
                ).innerText
          );
         } catch (error) {}
         if (captcha === ' Riješi CAPTCHA-u i prijeđi na pseću stranu! ') {
          console.log(i, link, captcha);
          await page.setTimeout(100000);}

        // STANJE
        let stanje
        try {
           stanje = await page.evaluate(
            () =>
              document.querySelector(
                "div.BlockStandard.BlockStandard--alpha.ClassifiedDetailUnavailableNotice > div > div > h3" 
                ).innerText
          );
          
         } catch (error) {}
         if (stanje === undefined) {stanje = "Aktivan"}
         console.log(stanje);

         let njuskalo_id = jedan.njuskalo_id;
         
        await db.query(
          `UPDATE oglasi SET stanje='${stanje}' WHERE njuskalo_id='${njuskalo_id}'`,
          (err, result) => {
            if (err) {
              console.log(err, link);
            }
          }
        );
       }
       await browser.close();
     });
}

stanje();