import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestimonial extends Document {
  name: string;
  location: string;
  goal: string;
  outcome: string;
  initial: string;
  rating: number;
  refId: string;
  avatarUrl?: string;
  imageUrl?: string;
  orderImageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true, default: "Customer Review" },
    location: { type: String, default: "" },
    goal: { type: String, default: "" },
    outcome: { type: String, default: "" },
    initial: { type: String, default: "C" },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    refId: { type: String, default: "ADMIN-CREATED" },
    avatarUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    /* Customer-shared photo of their delivered order — shown as a chat photo bubble */
    orderImageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for active testimonials and admin sort
TestimonialSchema.index({ isActive: 1, createdAt: -1 });
TestimonialSchema.index({ createdAt: -1 });

if (mongoose.models.Testimonial) {
  delete (mongoose.models as any).Testimonial;
}

const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);

export default Testimonial;
