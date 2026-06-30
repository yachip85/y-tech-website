const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend website files statically from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Multer Config for Files Upload Management
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Safely ensure directory 'uploads' exists
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// MongoDB Database URL
const MONGO_URI = 'mongodb://localhost:27017/ytech_db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB successfully connected...'))
    .catch(err => console.error('Database connection error:', err));

// MongoDB Document Architecture Structure Schema
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    category: { type: String, required: true },
    message: { type: String, required: true },
    filePath: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('ContactSubmission', contactSchema);

// API Route Engine to Handle Submission and Write on MongoDB
app.post('/api/submit', upload.single('file'), async (req, res) => {
    try {
        const { name, email, phone, category, message } = req.body;
        
        const newSubmission = new Contact({
            name,
            email,
            phone,
            category,
            message,
            filePath: req.file ? req.file.path : null
        });

        await newSubmission.save();
        
        res.send(`
            <div style="font-family:sans-serif; text-align:center; padding:50px; background-color: #f3f4f6; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <h1 style="color:#2563eb; margin-bottom: 10px;">Submission Successful!</h1>
                    <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">Thank you <strong>${name}</strong>, your response has been securely saved to MongoDB.</p>
                    <a href="javascript:history.back()" style="display: inline-block; background-color:#2563eb; color:white; padding: 10px 20px; text-decoration:none; border-radius: 8px; font-weight:bold;">Go Back</a>
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send('An error occurred while saving your data to MongoDB.');
    }
});

// Run application on explicit active port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running smoothly on http://localhost:${PORT}`);
});