import mongoose, { Schema, Document, Types } from "mongoose";
import Note from "./Note";

const taskStatus = {
  PENDING: "pending",
  ON_HOLD: "onHold",
  IN_PROGRESS: "inProgress",
  UNDER_REVIEW: "underReview",
  COMPLETED: "completed",
} as const;

export type TaskStatus = (typeof taskStatus)[keyof typeof taskStatus];

export interface ITaskFile {
  _id?: Types.ObjectId;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface ITask extends Document {
  name: string;
  description: string;
  project: Types.ObjectId;
  status: TaskStatus;
  dueDate: Date;
  completedBy: {
    user: Types.ObjectId;
    status: TaskStatus;
  }[];
  notes: Types.ObjectId[];
  archive: ITaskFile[];
  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema: Schema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    project: {
      type: Types.ObjectId,
      ref: "Project",
    },
    status: {
      type: String,
      enum: Object.values(taskStatus),
      default: taskStatus.PENDING,
    },
    dueDate: Date,
    completedBy: [
      {
        user: {
          type: Types.ObjectId,
          ref: "User",
          default: null,
        },
        status: {
          type: String,
          enum: Object.values(taskStatus),
          default: taskStatus.PENDING
        }
      }
    ],
    notes: [
      { 
        type: Types.ObjectId,
        ref: "Note",
      }
    ],
    archive: [
      {
        fileName: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        filePath: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        uploadedBy: {
          type: Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ]
  },
  { timestamps: true }
);

TaskSchema.pre('deleteOne', {document: true}, async function() {
    const taskId = this._id
    if(!taskId) return;
    await Note.deleteMany({task: taskId})
    
    // Eliminar archivos físicos del sistema de archivos
    const fs = require('fs').promises;
    const path = require('path');
    
    if (this.archive && Array.isArray(this.archive)) {
        for (const file of this.archive) {
            try {
                await fs.unlink(file.filePath);
            } catch (error) {
                console.error(`Error al eliminar archivo ${file.filePath}:`, error);
            }
        }
    }
})

const Task = mongoose.model<ITask>("Task", TaskSchema);
export default Task;
