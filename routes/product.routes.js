const express = require('express');
const router = express.Router();
const Product = require('../models/Product.model');
const User = require('../models/User.model'); 
const { isAuthenticated } = require("../middleware/jwt.middleware.js")
const fileUploader = require("../config/cloudinary.config");

router.post('/create', (req, res) => {
    const { name, description, image, brand, owner } = req.body;

    console.log('Received request to create a product with data:');
    console.log('Name:', name);
    console.log('Description:', description);
    console.log('Image:', image);
    console.log('Brand:', brand);
    console.log('Owner:', owner);

    if (!name || !description || !brand || !owner) {
        console.log('Validation error: Missing required fields');
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

  
    Product.create({
        name,
        description,
        image,
        brand,
        owner,
    })
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

router.post("/upload", fileUploader.single("image"), (req, res, next) => {
    // console.log("file is: ", req.file)

    if (!req.file) {
        next(new Error("No file uploaded!"));
        return;
    }

    // Get the URL of the uploaded file and send it as a response.
    // 'fileUrl' can be any name, just make sure you remember to use the same when accessing it on the frontend

    res.json({ fileUrl: req.file.path });
});

router.get('/all', isAuthenticated, (req, res) => {
    const userId = req.payload._id; 

    
    Product.find({ owner: userId })
        .then((products) => {
            res.status(200).json(products);
        })
        .catch((error) => {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Server error' });
        });
});

router.get('/:productId', (req, res) => {
    const productId = req.params.productId;
    console.log(productId)

    Product.findById(productId)
        .then((product) => {
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(200).json(product);
        })
        .catch((error) => {
            console.error('Error fetching product:', error);
            res.status(500).json({ message: 'Server error' });
        });
});

router.put('/update/:productId', (req, res) => {
    const productId = req.params.productId;
    const { name, description, photo, brand } = req.body;

    if (!name || !description || !brand) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    Product.findByIdAndUpdate(productId, {
        name,
        description,
        photo,
        brand,
    }, { new: true }) 
        .then((updatedProduct) => {
            if (!updatedProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }
            console.log('Product updated successfully:', updatedProduct);
            res.status(200).json(updatedProduct);
        })
        .catch((error) => {
            console.error('Error updating product:', error);
            res.status(500).json({ message: 'Server error' });
        });
});
router.delete('/delete/:productId', (req, res) => {
    const { productId } = req.params;
    console.log(productId)

    Product.findByIdAndDelete(productId)
        .then((deletedProduct) => {
            if (!deletedProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }

           
            User.findByIdAndUpdate(
                deletedProduct.owner,
                { $pull: { products: deletedProduct._id } },
                { new: true }
            )
                .then(() => {
                    console.log('Product and user updated successfully.');
                    res.status(200).json({ message: 'Product deleted successfully' });
                })
                .catch((error) => {
                    console.error('Error updating user:', error);
                    res.status(500).json({ message: 'Server error' });
                });
        })
        .catch((error) => {
            console.error('Error deleting product:', error);
            res.status(500).json({ message: 'Server error' });
        });
});


module.exports = router;