const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction.model');


router.get('/auctions', (req, res) => {
    Auction.find()
        .then((auctions) => {
            res.json(auctions);
        })
        .catch((error) => {
            console.error('Error fetching auctions:', error);
            res.status(500).json({ message: 'Server error' });
        });
});

module.exports = router;