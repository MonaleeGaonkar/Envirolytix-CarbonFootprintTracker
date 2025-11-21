import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

// 🧩 1. Expanded AvatarOptions type
export interface AvatarOptions {
  seed?: string;
  style?: string;
  mood?: string;
  color?: string;
  hair?: string[];
  hairColor?: string[];
  skinColor?: string;
  eyes?: string;
  mouth?: string;
  baseColor?: string;
  shirt?: string;
  earrings?: string;
  glasses?: string;
  facialHair?: string;
  earringsProbability?: number;
  glassesProbability?: number;
  facialHairProbability?: number;
  [key: string]: any; // ✅ future-proof — allows adding new fields
}

// 🧩 2. Updated IUser interface
export interface IUser extends Document {
  id: string;
  email: string;
  password?: string;
  name?: string;
  location?: string;
  ecoPoints: number;
  streak: number;
  totalCarbon: number;
  lastActivityAt?: Date;
  avatarOptions?: AvatarOptions;
  createdAt?: Date;
  updatedAt?: Date;
}

// 🧩 3. Schema definition
const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    location: { type: String, default: "" },
    ecoPoints: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    totalCarbon: { type: Number, default: 0 },
    lastActivityAt: { type: Date },
    // ✅ Mixed allows nested dynamic structures (hair, color, etc.)
    avatarOptions: {
      type: Schema.Types.Mixed,
      default: () => ({
        seed: "default",
        style: "default",
        mood: "happy",
        color: "green",
      }),
    },
  },
  { timestamps: true }
);

// 🧩 4. Virtual ID
userSchema.virtual("id").get(function (this: any) {
  return (this._id as mongoose.Types.ObjectId).toHexString();
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// 🧩 5. Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model<IUser>("User", userSchema);
