# hardware-price-scraper-api
[![Node.js CI](https://github.com/ntanck/hardware-price-scraper-api/actions/workflows/node.js.yml/badge.svg)](https://github.com/ntanck/hardware-price-scraper-api/actions/workflows/node.js.yml)

API for returning product details from multiple Brazilian hardware stores


## Utilization

Send a get request to `https://hardware-scraper-api.herokuapp.com/get` with valid store and query parameters.

Example: https://hardware-scraper-api.herokuapp.com/get?store=kabum&query=ryzen.

Available stores:
- PCXpress (pcxpress)
- Kabum (kabum)
- Pichau (pichau)

*Note:* Cissa was removed since they closed down permanently.

## Example response
```
[ 
  {
    "url":"https://www.kabum.com.br/produto/107545/processador-amd-ryzen-5-1600-cache-19mb-3-2ghz-3-6ghz-max-turbo-am4-yd1600bbafbox",
    "img":"https://images5.kabum.com.br/produtos/fotos/107545/processador-amd-ryzen-5-1600-cache-19mb-3-2ghz-3-6ghz-max-turbo-am4-yd1600bbafbox_1573653284_m.jpg",
    "name":"Processador AMD Ryzen 5 1600, Cache 19MB, 3.2GHz (3.6GHz Max Turbo), AM4 - YD1600BBAFBOX",
    "price":649.9
  }
]
```
