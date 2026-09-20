import mongoose, { Schema } from "mongoose";
// import { MAX_NAME_LENGTH } from "../config/config";

const msgSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },
  },
  { timestamps: true },
);
msgSchema.index({ room: 1, createdAt: -1 });

export const Message = mongoose.model("Message", msgSchema);
