import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import db from "../../db/index.js";

async function pocetakKuce(grad) {
  puppeteer.use(StealthPlugin());
  const funkcija = async (url) => {
    const page = await browser.newPage();
    const dodatak = "https://www.njuskalo.hr";
    await page.goto(url);
    await page.setDefaultNavigationTimeout(3000);
    let items = [];

    const productsHandles = await page.$$(
      "#form_browse_detailed_search > div > div.content-main > div.block-standard.block-standard--epsilon > div.EntityList.EntityList--Standard.EntityList--Regular.EntityList--ListItemRegularAd h3 > a"
    );
    for (const producthandle of productsHandles) {
      let naslov = await page.evaluate(
        (el) => el.innerText.replace(/\n/g, "").replace(/,/g, " "),
        producthandle
      );

      let link = await page.evaluate(
        (el) => el.getAttribute("href"),
        producthandle
      );
      link = dodatak + link;

      let njuskaloID = await page.evaluate(
        (el) => el.getAttribute("name"),
        producthandle
      );
      let tip = 'kuca'
      
      const isti = await db.query(`SELECT njuskalo_id FROM oglasi WHERE njuskalo_id = $1`, [njuskaloID]);
      if (isti.rows[0] === undefined) {
        items.push({ naslov, link, tip, njuskaloID });
      } else {} 
    }

    if (items.length < 1) {
      return items;
    } else {
      const nextPageNumber =
        parseInt(url.toString().match(/page=(\d+)$/)[1], 10) + 1;
      const nextUrl = `https://www.njuskalo.hr/prodaja-kuca/${grad}?page=${nextPageNumber}`;

      return items.concat(await funkcija(nextUrl));
    }
  };

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
    //userDataDir: "C:/Users/Josip/AppData/Local/Google/Chrome/User Data/Default"
  });
  const firstUrl = `https://www.njuskalo.hr/prodaja-kuca/${grad}?page=1`;
  const items = await funkcija(firstUrl);
  await browser.close();
  return items;

};

export default pocetakKuce;