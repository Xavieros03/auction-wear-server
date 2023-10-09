const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction.model');
const cron = require('node-cron');


const http = require('http');
const server = http.createServer();

const io = require('socket.io')(server);


cron.schedule('* * * * *', () => {
    let auctionsToStart = [];

    
    const currentTimestamp = new Date();

    Auction.find({
        status: 'scheduled',
        scheduledStartTime: { $lte: currentTimestamp },
    })
        .then((foundAuctions) => {
            auctionsToStart = foundAuctions;

            const promises = auctionsToStart.map(async (auction) => {
                auction.startTime = currentTimestamp;
                auction.endTime = new Date(currentTimestamp.getTime() + 5 * 60 * 1000); 
                auction.status = 'active';
                await auction.save();

                io.emit('auctionCreatedOrUpdated', auction); 
            });

            return Promise.all(promises);
        })
        .then(() => {
            console.log('Started', auctionsToStart.length, 'auctions.');
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
    const endTime = new Date(currentTimestamp.getTime() + 5 * 60 * 1000); // Set the end time (5 minutes from start)


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

module.exports = { router, server };