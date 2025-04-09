const express = require('express');
const repository = require('./repositories');
const multer = require("multer");
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/validatecode', repository.getValidateCode)
app.post('/registers', repository.postRegisters)
app.post('/truck', repository.postTruck)
app.get('/truck', repository.getTruck)
app.put('/update-register', upload.single('profilePicture'), repository.updateRegister)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(3000, () => console.log('Server running on port 3000'));