import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "owner" | "superadmin" | "admin";
  createdAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    // "owner" is the highest privilege and is what the live account uses. It was
    // missing from this enum, which meant Mongoose validation rejected any save of
    // that document. See lib/security/roles.ts for the authoritative list.
    role: { type: String, enum: ["owner", "superadmin", "admin"], default: "admin" },
  },
  { timestamps: true }
);

const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);

export default AdminUser;
