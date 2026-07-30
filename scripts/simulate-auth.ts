import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/db";
import AdminUser from "../models/AdminUser";

// Local debugging helper only — it reports whether the configured password
// matches the stored hash, which must never be runnable against production data.
async function simulate() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to run an auth-probe script with NODE_ENV=production.");
    process.exit(1);
  }
  await connectToDatabase();
  console.log("DB Name:", mongoose.connection.name);
  
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your environment before running this script.");
    process.exit(1);
  }
  console.log("Searching for:", email);

  const user = await AdminUser.findOne({ email });
  console.log("Found:", user ? user.email : "null");

  if (user) {
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log("Password valid:", isPasswordValid);
  }
  process.exit(0);
}
simulate();
