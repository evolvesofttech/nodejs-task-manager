const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

//Add new task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save();
        res.status(200).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
})

//Get all tasks of logged in user
//tasks?completed=true&limit=5&skip=0&sortBy=createdAt&sortOrder=desc
router.get('/tasks', auth, async (req, res) => {

    const match = {}

    if (req.query.completed) {
        match.completed = req.query.completed === "true"
    }

    try {
        await req.user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: {
                    [req.query.sortBy]: req.query.sortOrder === 'asc' ? 1 : -1
                }
            }
        }).execPopulate();
        res.status(200).send(req.user.tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

//Get signle task
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.status(200).send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

//Update task
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowUpdates = ["description", "completed"];
    const isValidOperation = updates.every(update => allowUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates!" })
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send({ error: 'Task not found.' });
        }
        updates.forEach(update => task[update] = req.body[update]);

        await task.save();

        res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
})

//Delete task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send({ error: 'Task not found.' })
        }
        res.status(200).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
})

module.exports = router;