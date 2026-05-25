import mongoose, { Schema, Document } from "mongoose";

export interface IIdempotencyKey extends Document {
  key: string;
  userId: mongoose.Types.ObjectId;
  response: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    key: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    response: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Unique per user so different users' keys can't collide
IdempotencyKeySchema.index({ key: 1, userId: 1 }, { unique: true });
// TTL index: MongoDB auto-deletes docs once expiresAt is past
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey =
  mongoose.models.IdempotencyKey ||
  mongoose.model<IIdempotencyKey>("IdempotencyKey", IdempotencyKeySchema);
