import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productsSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    condition: {
      type: String,
      required: true,
      enum: ["New", "Used"],
      default: "New"
    },
    category: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, required: false },
    cloudinaryId: { type: String, required: true },
    poster: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default model("Product", productsSchema);
