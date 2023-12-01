const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const fs = require('fs');
const { MongoClient } = require('mongodb'); // Import MongoDB driver

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

//MongoDB connection string
const mongoURI='mongodb://localhost:27017';

//connect to MongoDB

async function connectToMongoDB() {
  const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db(); // Return the database instance
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Handle quiz submission
app.post('/submit_quiz/:topic', async (req, res) => {
    const topic = req.params.topic;
    const answers = req.body; // Assuming form fields are named based on question IDs

    try {
        const db = await connectToMongoDB();
        const collection = db.collection('quiz_responses');

        // Insert submitted answers into the database
        await collection.insertOne({
            topic: topic,
            answers: answers,
            timestamp: new Date()
        });

        console.log(`Submitted answers for ${topic} stored in the database.`);
        res.redirect('/');
    } catch (error) {
        console.error('Error storing quiz data in MongoDB:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Load questions from a JSON file
const questionsData = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

// Route for the home page

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/', async (req, res) => {
  try {
    const db = await connectToMongoDB();
    // Query MongoDB to retrieve data.
    const quizData = await db.collection('quiz_responses').find().toArray();
    console.log('Quiz Data:', quizData);
    res.render('index', { quizData });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// Route for displaying and handling the quiz
app.get('/quiz/:topic', (req, res) => {
  const topic = req.params.topic;
  const quizQuestions = questionsData.filter(q => q.topic === topic);
  res.render('quiz', { topic, questions: quizQuestions });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


