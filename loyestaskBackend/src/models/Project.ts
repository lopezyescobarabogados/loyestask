import mongoose, { Schema, Document, PopulatedDoc, Types } from "mongoose";
import Task, { ITask } from "./Task";
import { IUser } from "./User";
import Note from "./Note";

const projectPriority = {
  HIGH : "high",
  MEDIUM: "medium",
  LOW: "low", 
} as const;

export type projectPriority = (typeof projectPriority)[keyof typeof projectPriority];

export interface IProject extends Document {
  projectName: string;
  clientName: string;
  description: string;
  priority: projectPriority;
  tasks: PopulatedDoc<ITask & Document>[];
  manager: PopulatedDoc<IUser & Document>;
  team: PopulatedDoc<IUser & Document>[];
}

const ProjectSchema: Schema = new Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(projectPriority),
      default: projectPriority.LOW,
    },
    tasks: [
      {
        type: Types.ObjectId,
        ref: "Task",
      },
    ],
    manager: {
      type: Types.ObjectId,
      ref: "User",
    },
    team: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

ProjectSchema.pre('deleteOne', {document: true}, async function() {
    const projectId = this._id
    if(!projectId) return;
    const tasks = await Task.find({project: projectId})
    for(const task of tasks) {
      await Note.deleteMany({task: task._id})
    }
    await Task.deleteMany({project: projectId})
})

const Project = mongoose.model<IProject>("Project", ProjectSchema);
export default Project;
