import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserEvaluation extends Document {
  user: Types.ObjectId;
  evaluatedBy: Types.ObjectId;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    taskCompletionRate: number; // porcentaje de tareas completadas a tiempo
    averageCompletionTime: number; // promedio de días para completar tareas
    productivity: number; // tareas completadas por período
    qualityScore: number; // puntuación de calidad (1-10)
  };
  score: number; // puntuación general (1-100)
  comments: string;
  recommendations: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserEvaluationSchema: Schema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    evaluatedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    metrics: {
      taskCompletionRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      averageCompletionTime: {
        type: Number,
        required: true,
        min: 0,
      },
      productivity: {
        type: Number,
        required: true,
        min: 0,
      },
      qualityScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
      },
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    comments: {
      type: String,
      required: true,
      trim: true,
    },
    recommendations: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Índices para optimizar consultas
UserEvaluationSchema.index({ user: 1, createdAt: -1 });
UserEvaluationSchema.index({ "period.startDate": 1, "period.endDate": 1 });

const UserEvaluation = mongoose.model<IUserEvaluation>("UserEvaluation", UserEvaluationSchema);
export default UserEvaluation;
