const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    street: {
      type: String,
      
    },
    city: {
      type: String,
      
    },
    state: {
      type: String,
      
    },
    postalCode: {
      type: String,
     
    },
    country: {
      type: String,
  
    },
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
  auctions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
    },
  ],
  wonProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
});

const User = mongoose.model('User', userSchema);

module.exports = User;