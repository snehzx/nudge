import mongoose, { Schema } from "mongoose";
// import { MAX_NAME_LENGTH } from "../config/config";

const msgSchema = new Schema(
  {
    from: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    room: {
      type: String,
      default: "general",
      index: true,
    },
  },
  { timestamps: true },
);
