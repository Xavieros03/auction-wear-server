const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction.model');
const cron = require('node-cron');
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

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
    cron.schedule('* * * * *', () => {
        const currentTimestamp = new Date();

        Auction.find({
            status: 'active',
            startTime: { $lte: currentTimestamp },
        })
            .then((activeAuctions) => {
                activeAuctions.forEach((auction) => {

                    const lastBidTime = auction.bids.length > 0 ? auction.bids[auction.bids.length - 1].timestamp : auction.startTime;
                    const timeDifference = currentTimestamp - lastBidTime;

                    if (timeDifference >= 5 * 60 * 1000) {

                        auction.status = 'completed';


                        if (auction.bids.length > 0) {
                            let highestBidAmount = -1;
                            let highestBidderId = null;

                            for (const bid of auction.bids) {
                                if (bid.amount > highestBidAmount) {
                                    highestBidAmount = bid.amount;
                                    highestBidderId = bid.bidder;
                                }
                            }

                            auction.winner = highestBidderId;
                        }

                        auction.save();


                        io.emit('auctionWinner', auction);
                    }
                });
            })
            .catch((error) => {
                console.error('Error checking and updating auctions:', error);
            });
    });

    router.get('/main', isAuthenticated, (req, res) => {
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

    router.post('/create', isAuthenticated, (req, res) => {
        const { productId, startingBid, scheduledStartTime, userId } = req.body;

        const sellerId = userId;

        const currentTimestamp = new Date();
        const startTime = scheduledStartTime;
        const endTime = new Date(currentTimestamp.getTime() + 5 * 60 * 1000);


        const initialBid = {
            bidder: userId,
            amount: parseFloat(startingBid),
            timestamp: new Date(),
        };

        const newAuction = new Auction({
            product: productId,
            seller: sellerId,
            startingBid,
            scheduledStartTime,
            startTime,
            endTime,
            participants: [userId],
            bids: [initialBid],
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

    router.get('/:auctionId', isAuthenticated, (req, res) => {
        const { auctionId } = req.params;

        Auction.findById(auctionId)
            .populate('product')
            .populate('winner')
            .then((auction) => {
                if (!auction) {
                    return res.status(404).json({ message: 'Auction not found' });
                }
                io.emit('auctionDetails', auction);

                res.status(200).json(auction);
            })
            .catch((error) => {
                console.error('Error fetching auction details:', error);
                res.status(500).json({ message: 'Server error' });
            });
    });

    router.put('/join/:auctionId', isAuthenticated, (req, res) => {
        const { auctionId } = req.params;
        const { userId } = req.body;

        Auction.findById(auctionId)
            .populate('product')
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
                        console.log(updatedAuction)
                        io.emit('auctionDetails', updatedAuction);
                        io.emit('participantsUpdated', updatedAuction);
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

    router.put('/bid/:auctionId', isAuthenticated, (req, res) => {
        const { auctionId } = req.params;
        const { bidder, amount } = req.body;
        console.log(bidder)

        Auction.findById(auctionId)
            .populate('product')
            .then((auction) => {
                console.log(auction.seller)
                if (!auction) {
                    return res.status(404).json({ message: 'Auction not found' });
                }

                if (auction.status !== 'active') {
                    return res.status(400).json({ message: 'Auction is not active' });
                }

                ;

                if (bidder.toString() === auction.seller.toString()) {
                    return res.status(400).json({ message: 'The auction seller cannot bid on their own auction' });
                }

                if (!auction.participants.find(participantId => participantId.toString() === bidder.toString())) {
                    return res.status(400).json({ message: 'You have not joined this auction' });
                }



                if (amount <= auction.currentBid) {
                    return res.status(400).json({ message: 'Bid amount is not higher than the current bid' });
                }


                const newBid = {
                    bidder: bidder,
                    amount: amount,
                };

                auction.bids.push(newBid);


                auction.currentBid = amount;

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