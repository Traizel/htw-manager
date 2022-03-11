require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.static("build"));

// Route includes
const itemRouter = require('./routes/itemrouter');
const captureRouter = require('./routes/index');



//change this to push update 2

app.use('/api/item', itemRouter);
app.use('/api/capture', captureRouter);
     

 const PORT = process.env.PORT || 5000;
 app.listen(PORT, () => {
   console.log("server running on: ", PORT);
 });