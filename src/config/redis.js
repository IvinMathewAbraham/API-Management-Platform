import Redis from "ioredis";

let redis;

const getRedis = () => {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || "",
      maxRetriesPerRequest: 3,
    });

    redis.on("error", (err) => {
      console.error("[Redis] connection error:", err.message);
    });

    redis.on("connect", () => {
      console.log("[Redis] connected successfully");
    });

    redis.on("reconnecting", () => {
      console.warn("[Redis] reconnecting…");
    });
  }
  return redis;
};

export default getRedis;