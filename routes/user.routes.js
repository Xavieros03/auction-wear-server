const express = require('express');
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware.js");
const User = require("../models/User.model");


router.get('/profile/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    if (id === 'null') {
        
        return res.status(401).json({ message: 'User not authenticated' });
    }

    
    User.findById(id)
        .then((user) => {
            res.json(user)
        })
        .catch((error) => {
            console.error('Error fetching user information:', error);
            res.status(500).json({ message: 'Server error' });
        });
});
router.put('/profile/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    if (id === 'null') {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    
    const updatedUserData = req.body;

    User.findByIdAndUpdate(id, updatedUserData, { new: true })
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(updatedUser);
        })
        .catch((error) => {
            console.error('Error updating user profile:', error);
            res.status(500).json({ message: 'Server error' });
        });
});


router.delete('/profile/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    if (id === 'null') {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    User.findByIdAndDelete(id)
        .then((deletedUser) => {
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        })
        .catch((error) => {
            console.error('Error deleting user profile:', error);
            res.status(500).json({ message: 'Server error' });
        });
});

module.exports = router;

