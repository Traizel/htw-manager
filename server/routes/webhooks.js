const express = require("express");
const {
  rejectUnauthenticated,
} = require("../modules/authentication-middleware");
const encryptLib = require("../modules/encryption");
const pool = require("../modules/pool");
const userStrategy = require("../strategies/user.strategy");
const router = express.Router();
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
require("dotenv").config();
const app = express();
const cors = require('cors');

app.use(cors({
  origin: ['https://www.heattransferwarehouse.com']
}));

const {
  updateNote,
  getSO,
} = require('./Capture/api');

const createNote = async (e, n) => {
  console.log('--INKSOFT-- Updating Note on BP...');
  await updateNote(e, n);
  console.log('--INKSOFT-- Note Updated..');
};

const inksoftSender = async (orderId) => {

  console.log('--INKSOFT-- Fetching order for inksoft: ', orderId);

  let newOrder = await axios
    .get(
      `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`,
      config
    )

  newOrder = newOrder.data;

  //console.log('--INKSOFT-- New Order Data: ', inksoft);

  const email = newOrder.billing_address.email;

    let designsToSend = [];
    let inksoftCart = [];
    let mainToken = inksoft[0].product_options[1].value;
    let currentCart = [];

    for (const i of inksoft) {

      let sku = i.sku;
      const skuSlice = sku.slice(0, 7);

      if (skuSlice === 'INKSOFT') {

        mainToken = i.product_options[1].value;
        let inksoftName = i.product_options[2].value;
        let quantity = i.quantity;

        console.log('--INKSOFT-- Token and Name: ', mainToken, inksoftName);

            inksoftCart = await axios
            .get(
              `https://stores.inksoft.com/DS350156262/Api2/GetCartPackage?SessionToken=${mainToken}&Format=JSON`,
              config
            )

        currentCart = inksoftCart.data.Data;
        //console.log('--INKSOFT-- Get Cart: ', currentCart);

        let inksoftItems = currentCart.Cart.Items;
        let inksoftDesigns = currentCart.DesignSummaries;
        let linkedId = 0;
        let foundDesign = {};
        let alreadyFound = false;
        let newName = "";

        for (const d of inksoftDesigns) {
            if (d.Name === inksoftName) {
                linkedId = d.DesignID;
                newName = `${d.Name} || ${orderId}`;
            }
        }

        if (linkedId === 0) {
        } else {
            for (const i of inksoftItems) {
                if (i.DesignId === linkedId) {
                    foundDesign = i;
                }
            }
        }

        for (const f of designsToSend) {
          if (f.DesignId === foundDesign.DesignId) {
            alreadyFound = true;
          }
        }

        if (foundDesign === {} || alreadyFound) {
        } else {
            foundDesign.Quantity = quantity;
            foundDesign.FullName = newName;
            foundDesign.Notes = orderId;
            designsToSend.push(foundDesign);
        }
    }
  }

    if (designsToSend === []) {
    } else {

        //console.log('--INKSOFT-- New Designs: ', designsToSend);

        currentCart.Cart.Items = designsToSend;

        let shippingMethods = [];


        try {

            shippingMethods = await axios
            .get(
              `https://stores.inksoft.com/DS350156262/Api2/GetShippingMethods?SessionToken=${mainToken}&Format=JSON&StoreId=296924`,
              config
            )

            shippingMethods = shippingMethods.data.Data[0];
            //console.log('--INKSOFT-- Get Ship Methods', shippingMethods);

        } catch (err) {
            console.log('--INKSOFT-- Error on Get Shipping: ', err);
            if (err.response.data.Messages) {
                console.log('--INKSOFT-- Get Shipping Error Messgae: ', err.response.data.Messages);
            }
            if (err.responseText) {
            console.log('--INKSOFT-- Get Shipping Error Messgae: ', err.responseText);
            }
        }


        currentCart.Cart.ShippingMethod = shippingMethods;
        currentCart.Cart.GuestEmail = '';

        let newCart = JSON.stringify(currentCart.Cart);
        let newNewCart = newCart.replace(/"/g, "'");

        //console.log('--INKSOFT-- New Cart Before Send: ', newNewCart);


        try {

          const data = `Cart=${newNewCart}&Format=JSON&SessionToken=${mainToken}&StoreId=296924`;

          config = {
            headers: {
              "X-Auth-Client": process.env.BG_AUTH_CLIENT,
              "X-Auth-Token": process.env.BG_AUTH_TOKEN,
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/x-www-form-urlencoded"
            },
          };

            await axios
            .post(
              `https://stores.inksoft.com/DS350156262/Api2/SetCart`,
              data,
              config
            )

            console.log('--INKSOFT-- Cart Modified..');

        } catch (err) {
            console.log('--INKSOFT-- Error on Set Cart: ', err);
            if (err.response.data.Messages) {
                console.log('--INKSOFT-- Set Cart Error Messgae: ', err.response.data.Messages);
            }
            if (err.responseText) {
            console.log('--INKSOFT-- Set Cart Error Messgae: ', err.responseText);
            }
        }

        let newOrder = [];

        try {

          const fileData = 'file';

          const data = `ExternalOrderId=${orderId}&PurchaseOrderNumber=${orderId}&SessionToken=${mainToken}&Email=${email}&StoreId=296924&FileData=${fileData}&IgnoreTotalDueCheck=true`;

          config = {
            headers: {
              "X-Auth-Client": process.env.BG_AUTH_CLIENT,
              "X-Auth-Token": process.env.BG_AUTH_TOKEN,
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/x-www-form-urlencoded"
            },
          };

          newOrder = await axios
            .post(
              `https://stores.inksoft.com/DS350156262/Api2/SaveCartOrder`,
              data,
              config
            )

            console.log('--INKSOFT-- Order Sent!');

        } catch (err) {
            console.log('--INKSOFT-- Error on Post Cart: ', err);
            if (err.responseText) {
            console.log('--INKSOFT-- Post Cart Error Messgae: ', err.responseText);
            }
        }

        const newOrderId = newOrder.data.Data;

        console.log('--INKSOFT-- New Order: ', newOrderId);

        try {
          const so = await getSO(orderId);
          console.log('--INKSOFT-- ', so.response.results[0][0]);
          const note = `Inksoft Order Number: ${newOrderId} --- Note made via Admin app. https://admin.heattransferwarehouse.com`;
          await createNote(so.response.results[0][0], note);
        } catch (err) {
          console.log('--INKSOFT-- Error on add note: ', err);
        }
    }
}

let storeHash = process.env.STORE_HASH

//BigCommerce API tokens and keys
let config = {
  headers: {
    "X-Auth-Client": process.env.BG_AUTH_CLIENT,
    "X-Auth-Token": process.env.BG_AUTH_TOKEN,
  },
};

router.post("/orders", cors(), async function (req, res) {

  res.sendStatus(200);

  const orderId = req.body.orderId;

  let inksoft = await axios
  .get(
    `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}/products`,
    config
  )

  inksoft = inksoft.data;

  //console.log('--INKSOFT-- Get Products: ', inksoft);

  let isInksoft = false;

  for (const i of inksoft) {

    let sku = i.sku;
    const skuSlice = sku.slice(0, 7);

    if (skuSlice === 'INKSOFT') {
      isInksoft = true;
    }

  }

if (isInksoft) {
    inksoftSender(orderId);
}

});



module.exports = router;