const express = require('express');
const axios = require('axios');
const router = express.Router();
const url = require('url');

const expressions = require('../config/regex.json');
const { parse } = require('path');

var getUrl = function (store, query, page = 1) {
  var lPrice = true;
  var storeUrl = {
    "kabum": `https://www.kabum.com.br/cgi-local/site/listagem/listagem.cgi?string=${query}&btnG=&pagina=1&ordem=${lPrice ? "3" : "5"}&limite=2000`,
    "pichau": `https://www.pichau.com.br/search?q=${query}&page=${page}&q=${query}${lPrice ? "&sort=price-asc" : ""}`,
    "pcxpress": `https://www.pcxpress.com.br/page/${page}/?${lPrice ? "orderby=price&" : ""}s=${query}&post_type=product`
  };

  return storeUrl[store];
}

var getProducts = function (store, query) {
  return new Promise(async function (resolve, reject) {
    let parsedProducts = [];
    
    if (store == "kabum") {
      let response = await getPage(getUrl(store, query));
      let products = JSON.parse(response.match(/(?<=listagemDados = ).*?(?=const listagem)/s));

      products.map(function (item) {
        parsedProducts.push({
          "url": `https://www.kabum.com.br${item.link_descricao}`,
          "img": item.img,
          "name": item.nome,
          "price": item.preco_desconto
        });
      });
    } else if (store=="pichau") {
      let response = await getPage(getUrl(store, query, page=1));
      let code = String(response.match(/\"items\":.*"banners/s))
      let products = JSON.parse("{" + code.substring(0,code.length-9));
      const promises = [];

      products.items.map(function (item) {
        parsedProducts.push({
          "url": `https://www.pichau.com.br/${item.url_key}`,
          "img": item.image.url,
          "name": item.name,
          "price": item.special_price
        });
      });

      for(let i = 2; i <= products.page_info.total_pages; i++) {
        promises.push(getAndParsePage(getUrl(store, query, page=i)));
      }

      parsedProducts = [].concat.apply(parsedProducts, await Promise.all(promises));
    } else {
      let i = 1;
      while (i) {
        try {
          let response = await axios(getUrl(store, query, i));
          html = response.data.match(new RegExp(expressions[store].content, "sg"))[0];
        }
        catch { break; }

        if (expressions[store].toRemove !== null) {
          html = html.replace(new RegExp(expressions[store].toRemove, "sg"), "")
        }

        var prices = html.match(new RegExp(expressions[store].prices, "sg"));

        if (prices == null) { break; }

        var urls = html.match(new RegExp(expressions[store].urls, "sg"));
        var names = html.match(new RegExp(expressions[store].names, "sg"));
        var images = html.match(new RegExp(expressions[store].images, "sg"));

        for (let j = 0; j < prices.length; j++) {
          parsedProducts.push({
            "url": urls[j],
            "img": images[j],
            "name": names[j],
            "price": parseFloat(prices[j].replace('.', '').replace(',', '.'))
          });
        }
        i++;
      }
    }
    resolve(parsedProducts);
  });
}

router.get('/get', async (req, res) => {
  try {
    res.header("Access-Control-Allow-Origin", "*");

    const options = url.parse(req.url, true).query;
    if (!Object.keys(expressions).includes(options.store)) {
      res.status(400);
      res.end('Invalid store/query parameters');
    } else {
      const products = await getProducts(options.store, options.query);

      if (products.length > 0) {
        res.json(products);
      } else {
        res.json('No products found');
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500);
    res.end('Server error');
  }
});

async function getPage(url) {
  let response = await axios({
    method: 'GET',
    url: url, 
    responseType: 'arraybuffer'
  });

  return(response.data.toString('latin1'));
}

async function getAndParsePage(url) {
  let parsedProducts = [];

  return new Promise(async resolve =>{
      let response = await axios({
        method: 'GET',
        url: url, 
        responseType: 'arraybuffer'
    });
    
    let code = String(response.data.toString('latin1').match(/\"items\":.*"banners/s));
    let products = JSON.parse("{" + code.substring(0,code.length-9));

    products.items.map(function (item) {
      parsedProducts.push({
        "url": `https://www.pichau.com.br/${item.url_key}`,
        "img": item.image.url,
        "name": item.name,
        "price": item.special_price
      });
    });

    resolve(parsedProducts);
  });
}

module.exports = router;
