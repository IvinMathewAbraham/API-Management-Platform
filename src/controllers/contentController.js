import Quote from "../models/Quote.js";
import Joke from "../models/Joke.js";

// GET /api/v1/quotes  — returns one random quote from MongoDB
export const getRandomQuote = async (req, res) => {
  const count = await Quote.countDocuments();
  if (count === 0) {
    return res.status(404).json({ message: "No quotes found. Seed the database first." });
  }
  const random = Math.floor(Math.random() * count);
  const quote = await Quote.findOne().skip(random);
  res.json(quote);
};

// GET /api/v1/jokes  — returns one random joke from MongoDB
export const getRandomJoke = async (req, res) => {
  const count = await Joke.countDocuments();
  if (count === 0) {
    return res.status(404).json({ message: "No jokes found. Seed the database first." });
  }
  const random = Math.floor(Math.random() * count);
  const joke = await Joke.findOne().skip(random);
  res.json(joke);
};
