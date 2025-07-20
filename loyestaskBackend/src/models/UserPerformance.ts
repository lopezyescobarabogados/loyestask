import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserPerformance extends Document {
  user: Types.ObjectId;
  task: Types.ObjectId;
  project: Types.ObjectId;
  statusChanges: {
    status: string;
    timestamp: Date;
    workingDaysFromStart: number;
  }[];
  completionTime?: number; // en días laborables
  isCompleted: boolean;
  isOnTime: boolean;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserPerformanceSchema: Schema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: Types.ObjectId,
      ref: "Task",
      required: true,
    },
    project: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
    },
    statusChanges: [
      {
        status: {
          type: String,
          enum: ["pending", "onHold", "inProgress", "underReview", "completed"],
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
        workingDaysFromStart: {
          type: Number,
          required: true,
        },
      },
    ],
    completionTime: {
      type: Number, // días laborables para completar
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isOnTime: {
      type: Boolean,
      default: null,
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Índices para optimizar consultas
UserPerformanceSchema.index({ user: 1, createdAt: -1 });
UserPerformanceSchema.index({ project: 1, user: 1 });
UserPerformanceSchema.index({ isCompleted: 1, user: 1 });

const UserPerformance = mongoose.model<IUserPerformance>("UserPerformance", UserPerformanceSchema);
export default UserPerformance;
