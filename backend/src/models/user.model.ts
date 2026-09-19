import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { lowercase, maxLength } from "zod";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxLength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

//its a ts type describing what one use doc should look like so that it knows what properties on the obj mongoose gave
export type UserDoc = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  refreshTokenHash: string | null;
  comparePassword(plain: string): Promise<boolean>;
};

export const User = mongoose.model<UserDoc>("User", userSchema);
