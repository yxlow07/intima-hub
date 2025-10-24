const express = require('express');
const path = require('path');

const app = express();
const PORT = 5173;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback: redirect all other routes to index.html for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Frontend server running on http://localhost:${PORT}`);
});