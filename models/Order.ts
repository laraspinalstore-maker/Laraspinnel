import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  /* Absent on custom-order requests, which aren't tied to a catalog product */
  productId?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  customText?: string;
  customImage?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode: string;
  notes?: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  orderType: "shop" | "custom";
  /**
   * Whether the stock reserved by this order has been returned to inventory.
   *
   * Set when the order moves to "cancelled" (or is deleted), and cleared if it
   * moves back out of "cancelled". Exists so the restore is idempotent: without
   * a flag, two concurrent cancellations — or a cancel followed by a delete —
   * would credit the same units twice and inflate stock.
   */
  stockRestored?: boolean;
  /* Inspiration images uploaded with a custom-order request */
  referenceImages?: string[];
  /* Structured request details from the custom-order form */
  customDetails?: {
    occasion?: string;
    colors?: string[];
    size?: string;
    quantityLabel?: string;
    personalization?: string;
    requirements?: string;
    preferredDate?: string;
    customerNote?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
  customText: { type: String },
  customImage: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    notes: { type: String },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"],
      default: "pending",
    },
    orderType: {
      type: String,
      enum: ["shop", "custom"],
      default: "shop",
    },
    stockRestored: { type: Boolean, default: false },
    referenceImages: { type: [String], default: undefined },
    customDetails: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
