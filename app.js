const express = require('express');
require("dotenv").config();

const app = express();
app.listen(process.env.PORT, () => console.log(`server started on port ${process.env.PORT}`));
