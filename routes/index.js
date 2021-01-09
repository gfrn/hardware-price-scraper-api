const express = require('express');
const axios = require('axios');
const router = express.Router();
const url = require('url');
const fs = require('fs');

const expressions = require('../config/regex.json');

var getUrl = function (store, query, page = 1) {
  var lPrice = true;
  var storeUrl = {
    "kabum": `https://www.kabum.com.br/cgi-local/site/listagem/listagem.cgi?string=${query}&btnG=&pagina=1&ordem=${lPrice ? "3" : "5"}&limite=2000`,
    "pichau": `https://www.pichau.com.br/catalogsearch/result/index/?p=${page}&q=${query}${lPrice ? "&product_list_order=price" : ""}&product_list_limit=48`,
    "cissa": `https://www.cissamagazine.com.br/busca?q=${lPrice ? query + "&ordem=menorpreco" : query}&p=${page}`,
    "pcxpress": `https://www.pcxpress.com.br/page/${page}/?${lPrice ? "orderby=price&" : ""}s=${query}&post_type=product`
  };

  return storeUrl[store];
}

var getProducts = function (store, query) {
  return new Promise(async function (resolve, reject) {
    let parsedProducts = [];
    if (store == "kabum") {
      let response = await axios(getUrl(store, query));
      let products = JSON.parse(response.data.match(/(?<=listagemDados = ).*?(?=const listagem)/s));

      products.map(function (item) {
        parsedProducts.push({
          "url": `https://www.kabum.com.br${item.link_descricao}`,
          "img": item.img,
          "name": item.nome,
          "price": item.preco_desconto
        });
      });
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

        for(let j = 0; j < prices.length; j++) {
          parsedProducts.push({
            "url": urls[j],
            "img": images[j],
            "name": names[j],
            "price": parseFloat(prices[j].replace('.','').replace(',','.'))
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
    if(!Object.keys(expressions).includes(options.store)) {
      res.status(400);
      res.end('Invalid store/query parameters');
    } else {
      const products = await getProducts(options.store, options.query);

      if(products.length > 0) {
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

module.exports = router;
