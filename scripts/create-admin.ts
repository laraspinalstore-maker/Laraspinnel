import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/db";
import AdminUser from "../models/AdminUser";

// Supported way to create the first admin, or to rotate an existing admin's
// password, now that a successful env-credential login no longer silently
// rewrites the stored hash (see lib/auth.ts). Run with:
//   npx tsx scripts/create-admin.ts
async function createAdmin() {
  await connectToDatabase();
  console.log("Connected to MongoDB...");

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your environment before running this script.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existingAdmin = await AdminUser.findOne({ email: email.toLowerCase() });
  
  if (existingAdmin) {
    existingAdmin.passwordHash = passwordHash;
    await existingAdmin.save();
    console.log(`Admin user ${email} updated successfully!`);
  } else {
    await AdminUser.create({
      name: "Senthil",
      email: email.toLowerCase(),
      passwordHash,
      role: "superadmin",
    });
    console.log(`Admin user ${email} created successfully!`);
  }

  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
