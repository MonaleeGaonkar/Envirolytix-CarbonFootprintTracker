import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import User, { IUser } from "../models/User";
import { LoginRequest, RegisterRequest, AuthResponse, UpdateProfileRequest } from "../types/api";

const authRouter = Router();

authRouter.use((req, res, next) => {
  const safeBody = { ...req.body };

  if (safeBody.password) {
    safeBody.password = "***HIDDEN***";
  }

  console.log(`📍 ${req.method} ${req.path}`, safeBody);
  next();
});


// 🔹 REGISTER
authRouter.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, location }: RegisterRequest = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    // Password will be hashed by the pre-save middleware
    const user = new User({
      email,
      password,
      name,
      location,
      avatarOptions: {
        seed: name,
        style: "default",
        mood: "happy",
        color: "green",
      },
    });

    await user.save();

    const response: AuthResponse = {
  token: `mock_token_${user._id}`,
  user: {
    id: user.id,
    name: user.name || "",
    email: user.email,
    location: user.location,
    ecoPoints: user.ecoPoints,
    streak: user.streak,
    totalCarbon: user.totalCarbon,
    lastActivityAt: user.lastActivityAt,
    avatarOptions: user.avatarOptions
  ? {
      seed: String(user.avatarOptions.seed ?? user.name ?? ""),
      style: user.avatarOptions.style ?? "default",
      mood: user.avatarOptions.mood ?? "happy",
      color: user.avatarOptions.color ?? "green",
      ...user.avatarOptions, // include all other saved fields like hair, etc.
    }
  : {
      seed: String(user.name ?? ""),
      style: "default",
      mood: "happy",
      color: "green",
    },

  },
};


    res.status(201).json(response);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 LOGIN
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing email or password" });

  try {
    // Use select('+password') to explicitly include the password field
    const user = await User.findOne({ email }).select('+password');
    
    // Use a constant-time comparison to prevent timing attacks
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password using bcrypt
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const response: AuthResponse = {
  token: `mock_token_${user._id}`,
  user: {
    id: user.id,
    name: user.name || "",
    email: user.email,
    location: user.location,
    ecoPoints: user.ecoPoints,
    streak: user.streak,
    totalCarbon: user.totalCarbon,
    lastActivityAt: user.lastActivityAt,
    avatarOptions: user.avatarOptions
  ? {
      seed: String(user.avatarOptions.seed ?? user.name ?? ""),
      style: user.avatarOptions.style ?? "default",
      mood: user.avatarOptions.mood ?? "happy",
      color: user.avatarOptions.color ?? "green",
      ...user.avatarOptions, // include all other saved fields like hair, etc.
    }
  : {
      seed: String(user.name ?? ""),
      style: "default",
      mood: "happy",
      color: "green",
    },

  },
};


    res.json(response);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 GET PROFILE by email
authRouter.get('/profile', async (req: Request, res: Response) => {
  const email = req.query.email as string | undefined;
  if (!email) return res.status(400).json({ error: 'Missing email parameter' });

  try {
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      ecoPoints: user.ecoPoints,
      streak: user.streak,
      totalCarbon: user.totalCarbon,
      lastActivityAt: user.lastActivityAt,
      avatarOptions: user.avatarOptions,
    });
  } catch (err) {
    console.error('Profile get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔹 UPDATE PROFILE
// 🔹 UPDATE PROFILE
authRouter.put('/profile', async (req: Request, res: Response) => {
  const { email, name, location, avatarOptions } = req.body as { 
    email?: string; 
    name?: string; 
    location?: string; 
    avatarOptions?: any 
  };
  
  // console.log('📥 Profile update request:', { email, name, location, avatarOptions });
  
  if (!email) {
    return res.status(400).json({ error: 'Missing email in request body' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let changed = false;

    // Update name
    if (typeof name === 'string' && name.trim() !== '') {
      user.name = name.trim();
      changed = true;
    }

    // Update location
    if (typeof location === 'string') {
      user.location = location;
      changed = true;
    }

    // Update avatarOptions - CRITICAL FIX
    if (avatarOptions && typeof avatarOptions === 'object') {
      // Ensure we preserve all fields and merge properly
      const currentOptions = user.avatarOptions || {};
      
      // Deep merge to preserve all nested fields
      user.avatarOptions = {
        seed: avatarOptions.seed ?? currentOptions.seed ?? user.name ?? 'default',
        style: avatarOptions.style ?? currentOptions.style ?? 'default',
        mood: avatarOptions.mood ?? currentOptions.mood ?? 'happy',
        color: avatarOptions.color ?? currentOptions.color ?? 'green',
        // Preserve all other avatar customization fields
        hair: avatarOptions.hair ?? currentOptions.hair,
        hairColor: avatarOptions.hairColor ?? currentOptions.hairColor,
        skinColor: avatarOptions.skinColor ?? currentOptions.skinColor,
        eyes: avatarOptions.eyes ?? currentOptions.eyes,
        mouth: avatarOptions.mouth ?? currentOptions.mouth,
        baseColor: avatarOptions.baseColor ?? currentOptions.baseColor,
        shirt: avatarOptions.shirt ?? currentOptions.shirt,
        earrings: avatarOptions.earrings ?? currentOptions.earrings,
        glasses: avatarOptions.glasses ?? currentOptions.glasses,
        facialHair: avatarOptions.facialHair ?? currentOptions.facialHair,
        earringsProbability: typeof avatarOptions.earringsProbability === 'number' 
          ? avatarOptions.earringsProbability 
          : currentOptions.earringsProbability ?? 0,
        glassesProbability: typeof avatarOptions.glassesProbability === 'number' 
          ? avatarOptions.glassesProbability 
          : currentOptions.glassesProbability ?? 0,
        facialHairProbability: typeof avatarOptions.facialHairProbability === 'number' 
          ? avatarOptions.facialHairProbability 
          : currentOptions.facialHairProbability ?? 0,
      };
      
      user.markModified('avatarOptions');
      changed = true;
      console.log('✅ Avatar options updated:', user.avatarOptions);
    }

    if (changed) {
      await user.save();
      console.log('💾 User saved successfully');
    }

    const response = {
      id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      ecoPoints: user.ecoPoints,
      streak: user.streak,
      totalCarbon: user.totalCarbon,
      lastActivityAt: user.lastActivityAt,
      avatarOptions: user.avatarOptions,
    };

    // console.log('📤 Sending response:', response);
    return res.json(response);

  } catch (err) {
    console.error('❌ Profile update error:', err);
    return res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
  }
});

export default authRouter;
