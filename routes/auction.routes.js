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
                foundAuctions.forEach((auction) => {

                    auction.status = 'active';
                    auction.save();


                    io.emit('auctionUpdated', auction);
                });
            })
            .catch((error) => {
                console.error('Error starting auctions:', error);
            });
    });

    router.get('/main', (req, res) => {
        Auction.find()
            .populate('product')
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
        const startTime = scheduledStartTime
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

    router.get('/:auctionId', (req, res) => {
        const { auctionId } = req.params;

        Auction.findById(auctionId)
            .populate('product')
            .then((auction) => {
                if (!auction) {
                    return res.status(404).json({ message: 'Auction not found' });
                }

                res.status(200).json(auction);
            })
            .catch((error) => {
                console.error('Error fetching auction details:', error);
                res.status(500).json({ message: 'Server error' });
            });
    });

    router.put('/join/:auctionId', (req, res) => {
        const { auctionId } = req.params;
        const { userId } = req.body;

        Auction.findById(auctionId)
            .then((auction) => {
                if (!auction) {
                    return res.status(404).json({ message: 'Auction not found' });
                }

                if (auction.status !== 'scheduled') {
                    return res.status(400).json({ message: 'Auction is not open for participants' });
                }


                if (auction.participants.includes(userId)) {
                    return res.status(400).json({ message: 'User is already a participant' });
                }


                auction.participants.push(userId);

                auction
                    .save()
                    .then((updatedAuction) => {
                        io.emit('auctionCreatedOrUpdated', updatedAuction);
                        res.status(200).json(updatedAuction);
                    })
                    .catch((error) => {
                        console.error('Error joining auction:', error);
                        res.status(500).json({ message: 'Server error' });
                    });
            })
            .catch((error) => {
                console.error('Error finding auction:', error);
                res.status(500).json({ message: 'Server error' });
            });
    });

    router.put('/bid/:auctionId', (req, res) => {
        const { auctionId } = req.params;
        const { userId, amount } = req.body;

        Auction.findById(auctionId)
            .then((auction) => {
                if (!auction) {
                    return res.status(404).json({ message: 'Auction not found' });
                }

                if (auction.status !== 'active') {
                    return res.status(400).json({ message: 'Auction is not active' });
                }


                if (amount <= auction.currentBid) {
                    return res.status(400).json({ message: 'Bid amount is not higher than the current bid' });
                }


                if (amount > auction.highestBid) {
                    auction.highestBid = amount;
                    auction.highestBidder = userId;
                }


                auction.currentBid = amount;
                auction.bids.push({ bidder: userId, amount });

                auction
                    .save()
                    .then((updatedAuction) => {
                        io.emit('bidPlaced', updatedAuction);
                        res.status(200).json(updatedAuction);
                    })
                    .catch((error) => {
                        console.error('Error updating bid information:', error);
                        res.status(500).json({ message: 'Server error' });
                    });
            })
            .catch((error) => {
                console.error('Error finding auction:', error);
                res.status(500).json({ message: 'Server error' });
            });
    });
    return router;
};