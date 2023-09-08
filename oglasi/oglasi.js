import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import spojeno from "./spojeno.js";
import db from "../../db/index.js";

async function oglasi(grad) {
  const items = await spojeno(grad);
  puppeteer.use(StealthPlugin());

  puppeteer
    .launch({
      headless: false,
      executablePath: executablePath(),
    })
    .then(async (browser) => {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);

      var svojstvo = [];
      var svojstva = [];

      for (const jedan of items) {
        await page.goto(jedan.link);
        await page.waitForSelector("body", {
          visible: true,
        });

        // KOORIDNATE
        try {
          var tocka = await page.evaluate(() =>
            JSON.parse(
              document
                .querySelector(
                  "body > div.wrap-main > div.wrap-content.ClassifiedDetail.cf > main > article > div.content-primary > div > div.content-main > script:nth-child(11)"
                )
                .textContent.replace("app.boot.push(", "")
                .replace(");", "")
            )
          );
          var lat = tocka.values.mapData.defaultMarker.lat;
        } catch (error) {
          var lat = "null";
        }

        try {
          var lon = tocka.values.mapData.defaultMarker.lng;
        } catch (error) {
          var lon = "null";
        }

        function vracaLokaciju() {
          if (lat !== "null" && lon !== "null") {
            return `ST_GeomFromText('POINT(${lon} ${lat})', 4326)`;
          } else {
            return null;
          }
        }

        let geometrija = vracaLokaciju();

        // OPIS
        try {
          var opis = await page.evaluate(() =>
            document
              .querySelector(
                "body > div.wrap-main > div.wrap-content.ClassifiedDetail.cf > main > article > div.content-primary > div > div.content-main > div.BlockStandard.ClassifiedDetailDescription > div > div"
              )
              .innerText.replace(/\n/g, "")
              .replaceAll("'", "")
          );
        } catch (error) {
          var opis = "null";
        }

        // CIJENA
        try {
          var cijena = await page.evaluate(
            () =>
              document.querySelector(
                "body > div.wrap-main > div.wrap-content.ClassifiedDetail.cf > main > article > div.content-primary > div > div.content-main > div:nth-child(3) > div.ClassifiedDetailSummary.cf > div.ClassifiedDetailSummary-topControls.cf > div.ClassifiedDetailSummary-pricesBlock > dl > dd"
              ).innerText
          );
          cijena = +cijena
            .split("/")[0]
            .replace(/\u00A0/, " ")
            .replace(" €", "")
            .replaceAll(".", "")
            .replace(",", ".");
        } catch (error) {
          var cijena = "null";
        }

        // SLUZI ZA OSTALA SVOJSTVA
        const brojsvojstava = Object.keys(
          await page.evaluate(() => document.querySelectorAll("dl > dt > span"))
        ).length;

        for (var i = 0; i < brojsvojstava; i++) {
          var nazivSvojstva = await page.evaluate(
            (i) => document.querySelectorAll("dl > dt > span")[i].textContent,
            i
          );
          var vrijednostSvojstva = await page.evaluate(
            (i) =>
              document.querySelectorAll(
                "dl > dd > span.ClassifiedDetailBasicDetails-textWrapContainer"
              )[i].textContent,
            i
          );
          svojstvo.push({ nazivSvojstva, vrijednostSvojstva });
        }
        svojstva = svojstvo.slice(-brojsvojstava); // nije najbolje al radi

        // POVRSINA
        if (jedan.tip === "zemljiste") {
          try {
            var povrsina = svojstva.filter(
              (x) => x.nazivSvojstva === "Površina"
            );
            povrsina = povrsina
              .map((x) => x.vrijednostSvojstva)
              .pop()
              .replace(" m²", "");
            povrsina = +povrsina.replaceAll(".", "").replace(",", ".");
          } catch (error) {
            var povrsina = "null";
          }
        } else {
          try {
            var povrsina = svojstva.filter(
              (x) => x.nazivSvojstva === "Stambena površina"
            );
            povrsina = povrsina
              .map((x) => x.vrijednostSvojstva)
              .pop()
              .replace(" m²", "");
            povrsina = +povrsina.replaceAll(".", "").replace(",", ".");
          } catch (error) {
            var povrsina = "null";
          }
        }

        // LOKACIJA
        try {
          var lokacija = svojstva.filter((x) => x.nazivSvojstva === "Lokacija");
          lokacija = lokacija.map((x) => x.vrijednostSvojstva).pop();
        } catch (error) {
          var lokacija = "null";
        }

        // CIJENA PO M2
        try {
          var cijenam2 = cijena / povrsina;
          cijenam2 = +cijenam2.toFixed(0);
        } catch (error) {
          var cijenam2 = "null";
        }

        // JE LI LOKACIJA(TOCNA/PRIBLIZNA/NE POSTOJI)
        try {
          var tocnaLokacija = await page.evaluate(() =>
            document
              .querySelector(
                "body > div.wrap-main > div.wrap-content.ClassifiedDetail.cf > main > article > div.content-primary > div > div.content-main > div.BlockStandard.ClassifiedDetailMap > div > span"
              )
              .textContent.trim()
          );

          if (tocnaLokacija === "Napomena: Prikazana je točna lokacija") {
            tocnaLokacija = true;
          } else if (
            tocnaLokacija === "Napomena: Prikazana je približna lokacija"
          ) {
            tocnaLokacija = false;
          }
        } catch (error) {
          tocnaLokacija = "null";
        }

        //DATUM
        try {
          var stariDatum = await page.evaluate(() =>
            document
              .querySelector(
                "body > div.wrap-main > div.wrap-content.ClassifiedDetail.cf > main > article > div.content-primary > div > div.content-main > div.BlockStandard.ClassifiedDetailSystemDetails.cf > dl > dd:nth-child(2)"
              )
              .textContent.trim()
          );
          const parts = stariDatum.split(/[. ]+/);
          const year = parts[2];
          const month = parts[1];
          const day = parts[0];
          var datum = `${year}-${month}-${day}`;
        } catch (err) {
          console.error(err);
        }

        //TIP ZEMLJISTA
        if (jedan.tip === "zemljiste") {
          try {
            var tipZemljista = svojstva.filter(
              (x) => x.nazivSvojstva === "Tip zemljišta"
            );
            tipZemljista = tipZemljista.map((x) => x.vrijednostSvojstva).pop();
          } catch (error) {
            var tipZemljista = "null";
          }
        } else {
          var tipZemljista = "null";
        }

        // BROJ PARKIRNIH MJESTA
        try {
          var parkingMjesta = svojstva.filter(
            (x) => x.nazivSvojstva === "Broj parkirnih mjesta"
          );
          parkingMjesta = +parkingMjesta.map((x) => x.vrijednostSvojstva).pop();
          if (isNaN(parkingMjesta)) {
            parkingMjesta = 0;
          }
        } catch (error) {
          console.log(error);
          var parkingMjesta = 0;
        }

        // GARAŽA
        try {
          var drugasvojstva = await page.$$(
            ".ClassifiedDetailPropertyGroups-groupListItem"
          );
        } catch (err) {
          console.log(err);
          drugasvojstva = "NULL";
        }
        let garaza = false;

        for (const jednosvojstvo of drugasvojstva) {
          const textContent = await page.evaluate(
            (element) => element.textContent,
            jednosvojstvo
          );
          if (
            textContent.includes("Garaža") ||
            textContent.includes("Garažno mjesto")
          ) {
            garaza = true;
            break; // Exit the loop if "Garaza" is found in any string
          }
        }

        // SLIKE
        try {
          var slika = await page.evaluate(() =>
            document
              .querySelector(
                "div > div.ClassifiedDetailGallery-sliderPanel > div.ClassifiedDetailGallery-slider > ul > li:nth-child(1) > div > figure > img"
              )
              .getAttribute("src")
          );
        } catch (err) {
          slika = "NULL";
        }

        var njuskaloID = jedan.njuskaloID;
        var link = jedan.link;
        var naslov = jedan.naslov;
        var tip = jedan.tip;

        await db.query(
          `INSERT INTO oglasi (njuskalo_id, naslov, povrsina, lokacija, tip, cijena, cijena_m2, tip_zemljista, opis, geom, tocna_lokacija, link, datum, slika, parking_mjesta, garaza) values ('${njuskaloID}', '${naslov}', '${povrsina}', '${lokacija}', '${tip}', '${cijena}', '${cijenam2}', '${tipZemljista}', '${opis}',
          ${geometrija}, '${tocnaLokacija}', '${link}', '${datum}', '${slika}', '${parkingMjesta}', '${garaza}')`,
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

oglasi("split");
