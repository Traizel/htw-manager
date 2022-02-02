const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const axios = require("axios");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


//Waiter Function
function timeoutPromise(interval) {
      return new Promise((resolve, reject) => {
        setTimeout(function () {
          resolve("done");
        }, interval);
      });
};


async function updatePrices(bc, sanmar) {
  try {
      if (bc[0]) {
        for (const item of bc) {
          console.log(`Updating Product with SKU: ${item.sku}`);
          await eachPrice(item, sanmar);
        }
        console.log('DONE');
        return;
      } else {
        console.log('No items in BC Items! Canceling!');
        return;
      }
    } catch (err) {
      console.log('Error on Update Product: ', err);
    }
    }

async function eachPrice(product, sanmar) {

      const sanmarIds = await getSanmarId(product);
      const variants = sanmarIds.data.data;

      for (const item of sanmar) {

        await eachSanmarItem(product, item, variants);

      }
    }

async function getSanmarId(product) {

  let config = {
    headers: {
      "X-Auth-Client": process.env.BG_AUTH_CLIENT,
      "X-Auth-Token": process.env.BG_AUTH_TOKEN,
    }
  };

  let items;

  try {
    items = await axios
      .get(
        `https://api.bigcommerce.com/stores/et4qthkygq/v3/catalog/products/${product.sku}/variants`,
        config
      )
  } catch (err) {
    console.log('Error on Get Items: ', err);
  }

  return items;
}


async function eachSanmarItem(product, item, vars) {
  let searchedName = item.name.search(`${product.name}`);

  if (searchedName === -1) {
    //console.log('Not Matched! Skipping!');
  } else {

    let putId = 0;

    for (const variant of vars) {
        if (variant.sku === item.sku) {
          putId = variant.id;
      }
    }

    if (putId !== 0) {
    
    console.log(`${product.sku} at ${putId} and $${item.price}`);

    const http = require("https");

    const options = {
      "method": "PUT",
      "hostname": "api.bigcommerce.com",
      "port": null,
      "path": `/stores/et4qthkygq/v3/catalog/products/${product.sku}/variants/${putId}`,
      "headers": {
        "accept": "application/json",
        "content-type": "application/json",
        "x-auth-token": "13n6uxj2je2wbnc0vggmz8sqjl93d1d"
      }
    };

    const req = http.request(options, function (res) {
      const chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        const body = Buffer.concat(chunks);
        console.log(body.toString());
      });
    });

    req.write(JSON.stringify({
      price: item.price
    }));
    req.end();

    } else {
      console.log('No Variant Found to sync ID!');
    }
  }
}


router.put("/updatePrices", async function (req, res) {
  console.log("We are updating sanmar prices..");
  const bc = req.body.bcItems;
  const sanmar = req.body.sanmar;

  res.sendStatus(200).send();

  try {
    await updatePrices(bc, sanmar);
  } catch (err) {
    console.log('Error on update Prices: ', err);
  }

});

router.get("/getitems", (req, res) => {
  console.log("We are about to get the item list");

  const queryText = `select * from "item" ORDER BY id DESC`;
  pool
    .query(queryText)
    .then((selectResult) => {
      res.send(selectResult.rows);
    })
    .catch((error) => {
      console.log(`Error on item query ${error}`);
      res.sendStatus(500);
    });
});

router.post("/items", async function (req, res) {
  console.log("We are about to add to the item list");

try {
  await addItems();
} catch (err) {
  console.log('Error on add items: ', err);
  return res.status(500);
}

try {
  res.sendStatus(200);
} catch (err) {
  console.log('Error on send 200: ', err);
  return res.status(500);
}

  async function addItems () {

  for (const product of req.body.products) {
        try {
          let name = product.name;
          let sku = product.sku;
          let bulk = parseInt(product.bulk);
          let width = product.width;
          let type = product.type;
          let color = product.color;
          let sales = product.sales;

          const queryText2 = `insert into "item" (name, sku, bulk, width, type, color, sales) VALUES ($1, $2, $3, $4, $5, $6, $7);`;
          await pool
            .query(queryText2, [name, sku, bulk, width, type, color, sales])
        } catch (err) {
          console.log('Error on get single item: ', err);
          return res.status(500);
        }
  }
 }
});


router.delete("/all", async function (req, res) {
  console.log("We are about to delete the item list");

  try {
    console.log('deleting items');
    const queryText = `DELETE from "item";`;
    await pool
      .query(queryText)
  } catch (err) {
    console.log('Error on delete items: ', err);
    return res.status(500);
  }

  try {
    res.sendStatus(200);
  } catch (err) {
    console.log('Error on send 200: ', err);
    return res.status(500);
  }
});

router.delete("/items:id", async function (req, res) {
  console.log("We are deleting items with id:", req.params.id);
  const id = req.params.id;
  console.log(id);
  
  try {
      const queryText = 'delete from "item" WHERE id = $1';
      await pool
        .query(queryText, [id])
      return res.status(200).send();
  } catch (err) {
    console.log('Error on delete: ', err);
    return res.status(500).send();
  }
    
});

router.put("/items/:id", async function (req, res) {
  console.log("We are updating items as dead with id:", req.params.id);
  const ids = req.params.id;

  let items = [];
  let itemToPush = '';
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] !== ',') {
      itemToPush += (ids[i]);
    } if (ids[i] === ',') {
      items.push(itemToPush);
      itemToPush = '';
    }
  }
  items.push(itemToPush);
  itemToPush = '';

  try {
    for (item of items) {
      console.log(item);
    const queryText = `UPDATE "item" SET dead = true WHERE id = ${item}`;
    await pool
      .query(queryText)
    }
  } catch (err) {
    console.log('Error on update: ', err);
    return res.status(500).send();
  }
  
  try {
    console.log("We are about to get the item list");

    const queryText = `select * from "item" ORDER BY id DESC`;
    await pool
      .query(queryText)
      .then((selectResult) => {
        res.send(selectResult.rows);
      })
      .catch((error) => {
        console.log(`Error on item query ${error}`);
        res.sendStatus(500);
      });
  } catch (err) {
    console.log('Error on Get: ', err);
    return res.status(500).send();
  }
    
});


module.exports = router;