const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve index.html from root directory
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error loading page');
            return;
        }
        res.send(data);
    });
});

// Mock product database
const products = [
    { id: 1, name: 'Elite Luxury Watch', price: 1299, category: 'Watches' },
    { id: 2, name: 'Designer Handbag', price: 899, category: 'Handbags' },
    { id: 3, name: 'Premium Sunglasses', price: 499, category: 'Sunglasses' }
];

// Mock AI responses for chatbot
const mockAIResponses = {
    hi: 'Hello! Welcome to EliteShop. How can I assist with your shopping today?',
    products: 'We offer premium luxury watches, handbags, and sunglasses. Would you like to see our featured products?',
    shipping: 'We provide free worldwide shipping on orders over $500. Delivery takes 3-5 business days.',
    payment: 'We accept secure payments via credit card, PayPal, and more. Your data is safe with us.',
    cart: 'I can help with your cart! Want to check your items or proceed to checkout?',
    default: 'I’m here to assist with your shopping needs. Ask about products, shipping, or payments!'
};

// API endpoint for products
app.get('/api/products', (req, res) => {
    res.json(products);
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.emit('message', 'Welcome to EliteShop! How can I assist you today?');

    socket.on('message', async (msg) => {
        console.log(`Received message: ${msg}`);
        io.emit('message', `You: ${msg}`);

        const lowerMessage = msg.toLowerCase();
        let response = mockAIResponses.default;

        for (const [key, value] of Object.entries(mockAIResponses)) {
            if (lowerMessage.includes(key)) {
                response = value;
                break;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        io.emit('message', response);

        if (lowerMessage.includes('products') || lowerMessage.includes('shop')) {
            const productList = products.map(p => `${p.name} - $${p.price}`).join(', ');
            io.emit('message', `Our featured products: ${productList}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the website at http://localhost:${PORT} or your Render URL`);
});
