const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    startingBid: {
        type: Number,
        required: true,
    },
    currentBid: {
        type: Number,
        default: 0,
    },
    bids: [
        {
            bidder: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            amount: Number,
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    status: {
        type: String,
        enum: ['active', 'completed', 'scheduled'],
        default: 'scheduled',
    },
    startTime: {
        type: Date,
        required: true,
    },
    scheduledStartTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    highestBid: {
        type: Number,
        default: 0,
    },
    highestBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    bidCount: {
        type: Number,
        default: 0,
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
   
});

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;