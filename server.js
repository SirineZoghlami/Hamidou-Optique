const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'produit/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({ storage });

// Middleware to parse JSON, form data, and handle file uploads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // Serve static files

// MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Update if your MySQL root user has a password
    database: 'optique'
});

connection.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Read all glasses or by category
app.get('/api/glasses', (req, res) => {
    const category = req.query.category;
    let query = 'SELECT * FROM glasses';
    let params = [];
    
    if (category) {
        query += ' WHERE category = ?';
        params.push(category);
    }
    
    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error querying glasses:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

// Create a new glass entry
app.post('/api/glasses', upload.single('image'), (req, res) => {
    const { name, brand, price, category } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !brand || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = 'INSERT INTO glasses (name, brand, price, image, category) VALUES (?, ?, ?, ?, ?)';
    
    connection.query(query, [name, brand, price, image, category], (err, result) => {
        if (err) {
            console.error('Error inserting glass:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ id: result.insertId, name, brand, price, image, category });
    });
});

// Update a glass entry
app.put('/api/glasses/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, brand, price, category } = req.body;
    const image = req.file ? req.file.filename : req.body.image;

    if (!name || !brand || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = 'UPDATE glasses SET name = ?, brand = ?, price = ?, image = ?, category = ? WHERE id = ?';
    
    connection.query(query, [name, brand, price, image, category, id], (err, result) => {
        if (err) {
            console.error('Error updating glass:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ id, name, brand, price, image, category });
    });
});

// Delete a glass entry
app.delete('/api/glasses/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM glasses WHERE id = ?';
    
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting glass:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Glass deleted successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});