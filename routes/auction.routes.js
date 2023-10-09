const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction.model');
const cron = require('node-cron');
const io = require('../app').io;

module.exports = (io) => {
    cron.schedule('* * * * *', () => {
        const currentTimestamp = new Date();

        Auction.find({
            status: 'scheduled',
            scheduledStartTime: { $lte: currentTimestamp },
        })
            .then((foundAuctions) => {
                io.emit('auctionCreatedOrUpdated', foundAuctions); 
            })
            .catch((error) => {
                console.error('Error starting auctions:', error);
            });
    });

    router.get('/main', (req, res) => {
        Auction.find()
            .then((auctions) => {
                res.json(auctions);
            })
            .catch((error) => {
                console.error('Error fetching auctions:', error);
                res.status(500).json({ message: 'Server error' });
            });
    });

    router.post('/create', (req, res) => {
        const { productId, startingBid, scheduledStartTime, userId } = req.body;

        const sellerId = userId;

        const currentTimestamp = new Date();
        const startTime = currentTimestamp;
        const endTime = new Date(currentTimestamp.getTime() + 5 * 60 * 1000); 

        const newAuction = new Auction({
            product: productId,
            seller: sellerId,
            startingBid,
            scheduledStartTime,
            startTime,
            endTime,
            participants: [userId],
        });

        newAuction
            .save()
            .then((auction) => {
                
                io.emit('auctionCreatedOrUpdated', auction);
                res.status(201).json(auction);
            })
            .catch((error) => {
                console.error('Error creating auction:', error);
                res.status(500).json({ message: 'Server error' });
            });
    });

    return router;
};