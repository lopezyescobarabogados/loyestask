import type { Request, Response } from "express";
import Project from "../models/Project";

export class ProjectController {
  static createProject = async (req: Request, res: Response) => {
    const project = new Project(req.body);
    project.manager = req.user.id; // Assign the authenticated user as the project manager
    try {
      await project.save();
      res.send("Projecto creado correctamente");
    } catch (error) {
      console.log(error);
    }
  };

  static getAllProjects = async (req: Request, res: Response) => {
    try {
      const projects = await Project.find({
        $or: [
          {manager: {$in: req.user.id}}, 
          {team: {$in: req.user.id}}
        ]
      });
      res.json(projects);
    } catch (error) {
      console.log(error);
    }
  };

  static getProjectsById = async (req: Request, res: Response) => {
    try {
      if(req.project.manager.toString() !== req.user.id.toString() && !req.project.team.includes(req.user.id)) {
        const error = new Error("No tienes permiso para ver este proyecto");
        res.status(404).json({error: error.message});
      }
      res.json(req.project);
      } catch (error) {
      console.log(error);
    }
  };

  static updateProject = async (req: Request, res: Response) => {
    try {
      req.project.projectName = req.body.projectName
      req.project.clientName = req.body.clientName
      req.project.description = req.body.description
      await req.project.save();
      res.send("Proyecto Actualizado");
    } catch (error) {
      console.log(error);
    }
  };

  static deleteProject = async (req: Request, res: Response) => {
    try {
      await req.project.deleteOne();
      res.send("Proyecto Eliminado");
    } catch (error) {
      console.log(error);
    }
  };

  static updatePriority = async (req: Request, res: Response) => {
    try {
      const { priority } = req.body
      req.project.priority = priority
      await req.project.save()
      res.send("Prioridad Actualizada")
    } catch (error) {
      console.log(error)
      res.status(500).json({error: "Hubo un error"});
    }
  }
}
