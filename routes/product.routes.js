const express = require('express');
const router = express.Router();
const Product = require('../models/Product.model');
const User = require('../models/User.model'); 

router.post('/create', (req, res) => {
    const { name, description, photo, brand, owner } = req.body;

    console.log('Received request to create a product with data:');
    console.log('Name:', name);
    console.log('Description:', description);
    console.log('Photo:', photo);
    console.log('Brand:', brand);
    console.log('Owner:', owner);

    if (!name || !description || !brand || !owner) {
        console.log('Validation error: Missing required fields');
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const newProduct = new Product({
        name,
        description,
        photo,
        brand,
        owner,
    });

    newProduct
        .save()
        .then((product) => {
            console.log('Product created successfully:', product);

            
            User.findByIdAndUpdate(owner, { $push: { products: product._id } })
                .then(() => {
                    console.log('User updated with the new product.');
                    res.status(201).json(product);
                })
                .catch((error) => {
                    console.error('Error updating user:', error);
                    res.status(500).json({ message: 'Server error' });
                });
        })
        .catch((error) => {
            console.error('Error creating product:', error);
            res.status(500).json({ message: 'Server error' });
        });
});

router.get('/all', (req, res) => {
    Product.find()
        .then((products) => {
            res.status(200).json(products);
        })
        .catch((error) => {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Server error' });
        });
});

module.exports = router;