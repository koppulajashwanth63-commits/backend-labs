// Part 2: the same server rewritten with Express
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// GET / -> welcome text
app.get('/', (req, res) => {
  res.status(200).send('Welcome to my Express server!');
});

// GET /about -> JSON with name and section
app.get('/about', (req, res) => {
  res.status(200).json({ name: 'K.Jashwanth Reddy', section: 'CSE (GEN.AI)' });
});

// GET /time -> current date and time
app.get('/time', (req, res) => {
  res.status(200).send(new Date().toString());
});

// 404 for any unknown path (must come after all other routes)
app.use((req, res) => {
  res.status(404).send('404 - Route not found');
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
