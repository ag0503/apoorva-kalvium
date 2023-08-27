const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const mathjs = require('mathjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Maintain a history of the last 20 operations
const historyFile = 'history.json';
let history = [];

// Load history from file if available
if (fs.existsSync(historyFile)) {
  const data = fs.readFileSync(historyFile, 'utf8');
  history = JSON.parse(data);
}

// Middleware to track operations and update history
app.use((req, res, next) => {
  const { method, url, body } = req;
  if (method === 'GET' && url !== '/history') {
    const operation = { method, url, body, timestamp: new Date() };
    history.push(operation);
    if (history.length > 20) {
      history.shift(); // Maintain only the last 20 operations
    }
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
  }
  next();
});

// Custom route to parse and evaluate expressions
app.get('/calculate/*', (req, res) => {
  const expressionParts = req.params[0].split('/');
  let parsedExpression = expressionParts.join('').replace(/into/g, '*').replace(/plus/g, '+').replace(/minus/g, '-');

  try {
    const answer = mathjs.evaluate(parsedExpression);
    res.json({ question: parsedExpression, answer });
  } catch (error) {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

// Retrieve history of operations
app.get('/history', (req, res) => {
  res.json(history);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
