import mongoose from "mongoose";

const connectDB = async () => {
  const connectionString = process.env.MONGO_URI;

  if (!connectionString) {
    console.error(
      "MongoDB connection error: CONNECTION_STRING environment variable is not set or is empty."
    );
    process.exit(1);
  }

  try {
    const connect = await mongoose.connect(connectionString);

    console.log(
      `MongoDB connected: ${connect.connection.host}, Database: ${connect.connection.name}`
    );
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;