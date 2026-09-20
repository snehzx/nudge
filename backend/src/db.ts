import mongoose from "mongoose";
import { MONGO_URI } from "./config/config.ts";
export const connectDB = async () => {
  try {
    const connectionIns = await mongoose.connect(MONGO_URI);
    console.log(`mongodb connected ${connectionIns.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
