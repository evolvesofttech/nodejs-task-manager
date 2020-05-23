const express = require('express');
require('./db/mongoose');
const User = require('./models/user');
const Task = require('./models/task');
const userRouter = require('./routes/user');

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(userRouter);

app.listen(port, () => {
    console.log("Server is up on port: ", port);
})