const mongoose = require('mongoose');

const connectionURL = 'mongodb+srv://sameer:BcsuHgFKoSBmRPEN@cluster0-s9shs.mongodb.net/task-manager?retryWrites=true&w=majority';

mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useCreateIndex: true
})