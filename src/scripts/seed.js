import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Quote from "../models/Quote.js";
import Joke from "../models/Joke.js";

const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "motivation" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "motivation" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs", category: "motivation" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "life" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "motivation" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "motivation" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", category: "motivation" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", category: "motivation" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James", category: "motivation" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill", category: "motivation" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "motivation" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "wisdom" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", category: "life" },
  { text: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey", category: "life" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "wisdom" },
  { text: "An unexamined life is not worth living.", author: "Socrates", category: "wisdom" },
  { text: "Eighty percent of success is showing up.", author: "Woody Allen", category: "humor" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", category: "motivation" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "motivation" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair", category: "motivation" },
];

const jokes = [
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs.", category: "programming" },
  { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache.", category: "programming" },
  { setup: "How many programmers does it take to change a light bulb?", punchline: "None — that's a hardware problem.", category: "programming" },
  { setup: "Why do Java developers wear glasses?", punchline: "Because they can't C#.", category: "programming" },
  { setup: "What's the best thing about a Boolean?", punchline: "Even if you're wrong, you're only off by a bit.", category: "programming" },
  { setup: "Why was the JavaScript developer sad?", punchline: "Because he didn't Node how to Express himself.", category: "programming" },
  { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear.", category: "dad" },
  { setup: "I'm reading a book about anti-gravity.", punchline: "It's impossible to put down!", category: "dad" },
  { setup: "Did you hear about the restaurant on the moon?", punchline: "Great food, no atmosphere.", category: "dad" },
  { setup: "What do you call fake spaghetti?", punchline: "An impasta!", category: "dad" },
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!", category: "pun" },
  { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved.", category: "pun" },
  { setup: "I told my wife she was drawing her eyebrows too high.", punchline: "She looked surprised.", category: "pun" },
  { setup: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field.", category: "pun" },
  { setup: "What do you call a lazy kangaroo?", punchline: "A pouch potato.", category: "dad" },
  { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired.", category: "pun" },
  { setup: "What's a computer's favorite snack?", punchline: "Microchips.", category: "programming" },
  { setup: "Why did the API break up with the database?", punchline: "There were too many unresolved issues.", category: "programming" },
  { setup: "What is a programmer's favorite hangout place?", punchline: "Foo Bar.", category: "programming" },
  { setup: "Why do cows have hooves instead of feet?", punchline: "Because they lactose.", category: "pun" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[Seed] Connected to MongoDB");

    // Quotes
    const existingQuotes = await Quote.countDocuments();
    if (existingQuotes > 0) {
      console.log(`[Seed] Quotes collection already has ${existingQuotes} docs — skipping`);
    } else {
      await Quote.insertMany(quotes);
      console.log(`[Seed] Inserted ${quotes.length} quotes`);
    }

    // Jokes
    const existingJokes = await Joke.countDocuments();
    if (existingJokes > 0) {
      console.log(`[Seed] Jokes collection already has ${existingJokes} docs — skipping`);
    } else {
      await Joke.insertMany(jokes);
      console.log(`[Seed] Inserted ${jokes.length} jokes`);
    }

    console.log("[Seed] Done!");
  } catch (err) {
    console.error("[Seed] Error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
