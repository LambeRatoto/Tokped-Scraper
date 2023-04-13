const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function tokoped(product, end) {
  console.time('Scraping Time'); // Start the timer
  const promises = await [];
  for (let page = 1; page <= (end && end > 0 ? end : 6); page += 1) {
    promises.push(
        /*
        axios.get(`https://www.tokopedia.com/find/${product.replace(/\s+/g, '-')}?page=${page}`, {
            delay: 50 // add a delay of 500ms
        })*/
        axios.get(`https://www.tokopedia.com/find/${product.replace(/\s+/g, '-')}?page=${page}`)
        .then(({ data }) => {
          const $ = cheerio.load(data);
          if($('div.css-1vknpta > div.css-ovjotx > div.css-y5gcsw > div.css-5fmc3z > div.css-qa82pd > div.prd_container-card.css-1c4umxf > div.pcv3__container.css-gfx8z3').length < 1) {
            return Promise.reject('Produk Tidak Ditemukan'); // reject the promise if the end of results is found
          }
          const judul = [];
          const harga = [];
          const diskon = [];
          const lbldiskon = [];
          const seller = [];
          const thumb = [];
          const lokasi = [];
          const terjual = [];
          const rating = [];
          const link = [];
          $('div.css-1vknpta > div.css-ovjotx > div.css-y5gcsw > div.css-5fmc3z > div.css-qa82pd > div.prd_container-card.css-1c4umxf > div.pcv3__container.css-gfx8z3').each(function (a, b) {
            const linkur = $(b).find('div.css-974ipl > a').attr('href')
            let url = "";
                if (linkur.startsWith('/')) {
                const clean = /\?.*/; // matches the query string starting with "?"
                const cleanUrl = linkur.replace(clean, ''); // removes the query string from the URL
                url = 'https://www.tokopedia.com' + cleanUrl;
            } else {
                const regex = /https%3A%2F%2F.*%3F/
                const match = regex.exec(linkur)
                url = match[0].replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)))
            }
            //console.log(url)
            link.push(url);
            judul.push($(b).find('div.css-974ipl > a > div.prd_link-product-name.css-3um8ox').text());
            harga.push($(b).find('div.css-974ipl > a > div > div.prd_link-product-price.css-1ksb19c').text())
            diskon.push($(b).find('div.css-974ipl > a > div > div.css-hwbdeb > div.prd_label-product-slash-price.css-1u1z2kp').text())
            lbldiskon.push($(b).find('div.css-974ipl > a > div > div.css-hwbdeb > div.prd_badge-product-discount.css-1qtulwh').text())
            lokasi.push($(b).find('div.css-974ipl > a > div.css-yaxhi2 > div.css-1ktbh56 > div.css-1rn0irl > span.prd_link-shop-loc.css-1kdc32b.flip').text())
            seller.push($(b).find('div.css-974ipl > a > div.css-yaxhi2 > div.css-1ktbh56 > div.css-1rn0irl > span.prd_link-shop-name.css-1kdc32b.flip').text());
            terjual.push($(b).find('div.css-974ipl > a > div.css-yaxhi2 > div.prd_shop-rating-average-and-label.css-q9wnub > span.prd_label-integrity.css-1duhs3e').text());
            rating.push($(b).find('div.css-974ipl > a > div.css-yaxhi2 > div.prd_shop-rating-average-and-label.css-q9wnub > span.prd_rating-average-text.css-t70v7i').text());
            thumb.push($(b).find('div.css-1f2quy8 > a > div.css-1mygogd > img').attr('src'))
          });
          const result = judul.map((judul, i) => {
            return {
              judul: judul,
              harga: harga[i],
              isdiskon: diskon[i] ? {
                diskon: diskon[i],
                dicountpercent: lbldiskon[i],
              } : "none",
              isterjual: terjual[i] ? {
                terjual: terjual[i],
                rating: rating[i],
              } : "none",
              seller: seller[i],
              lokasi: lokasi[i],
              link: link[i],
              thumb: thumb[i],
            }
          });
          return result;
        })
    ), { delay: 500 }
  }

  // Wait for all the Promises to resolve with the scraped data using Promise.all()
  return Promise.all(promises)
    .then((results) => {
      const flattenedResults = results.flat();
      console.timeEnd('Scraping Time'); // Stop the timer and print the elapsed time
      console.log('Product: ' + flattenedResults.length)
      return flattenedResults;
    });
}

let tokped;
const start = Date.now(); // Get the start timestamp
tokoped('earphone')
  .then((result) => {
    const end = Date.now(); // Get the end timestamp
    const elapsed = end - start; // Calculate the elapsed time in milliseconds
    tokped = {
      scraped_by: 'shironexo',
      status: '200 OK',
      time_taken: elapsed + 'ms', // Add the elapsed time to the object
      total: result.length + ' product',
      result: result
    };
  })
  .catch((err) => {
    tokped = {
      scraped: 'shironexo',
      status: '404 Not Found',
      result: err
    };
  })
  .finally(() => {
    return new Promise((resolve) => {
      const jsonResult = JSON.stringify(tokped, null, 2);
      fs.writeFileSync('tokped.json', jsonResult);
      console.log(`Saved ${tokped.result.length} Scrape to tokped.json`);
      resolve();
    });
  });

