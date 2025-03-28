const express = require('express');
const repository = require('./repositories');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/validatecode', repository.getValidateCode)
app.post('/registers', repository.postRegisters)
app.put('/update-register', repository.updateRegister)

app.listen(3000, () => console.log('Server running on port 3000'));