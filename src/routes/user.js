const express = require('express');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');

const upload = multer({
    limits: {
        fileSize: 100000 //1 MB
    },
    fileFilter(req, file, cb){
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Only image file is supported!'))
        }
        cb(undefined, true);
    }
})

//Register user
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
})

//Login user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
})

//Get all users
router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
})

//Get logged in user profile
router.get('/users/me', auth, async (req, res) => {
    try {
        res.status(200).send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
})

//Get single user by user id
router.get('/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
})

//Update user
router.patch('/users/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowUpdates = ["name", "email", "age", "password"];
    const isValidOperation = updates.every(update => allowUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" })
    }
    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();

        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

//Logout user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)

        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
})

//Logout user from all devices
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
})

//Delete user profile
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
    .resize({ width: 250, height: 250 }).png().toBuffer();
    
    req.user.avatar = buffer;
    
    await req.user.save();
    res.status(200).send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.status(200).send();
    } catch (error) {
        res.status(400).send(error);
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/jpg');
        
        res.status(200).send(user.avatar);
    } catch (error) {
        res.status(404).send(error);
    }
})

module.exports = router;