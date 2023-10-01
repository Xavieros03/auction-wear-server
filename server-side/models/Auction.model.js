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
            // Timestamp for bid placement
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    status: {
        type: String,
        enum: ['active', 'completed', 'expired'], // Define possible auction statuses
        default: 'active', // Set the default status
    },
    endTime: {
        type: Date,
        required: true,
    },
});

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;