const express = require('express');
const repository = require('./repositories');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.get('/registers', repository.getRegisters)
app.post('/registers', repository.postRegisters)

app.listen(3000, () => console.log('Server running on port 3000'));