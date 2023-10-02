const express = require('express');
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware.js");
const User = require("../models/User.model");

// Define a route to retrieve user information
router.get('/profile/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    if (id === 'null') {
        // Handle the case when id is 'null' (not authenticated)
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Continue with fetching the user profile for a valid id
    User.findById(id)
        .then((user) => {
            res.json(user)
        })
        .catch((error) => {
            console.error('Error fetching user information:', error);
            res.status(500).json({ message: 'Server error' });
        });
});

module.exports = router;