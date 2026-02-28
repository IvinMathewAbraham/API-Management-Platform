import ioredis from "ioredis";

let redis;

const getRedis = () => {
  if (!redis) {
    redis = new ioredis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || "",
    });
  }
  return redis;
};

export default getRedis;