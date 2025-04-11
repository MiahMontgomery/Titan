import { Router } from "express";
import { storage } from "../storage";
import { WebSocketMessageType } from "@shared/types";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";

export function projectController(router: Router, broadcast: (message: any) => void) {
  // Get all projects
  router.get('/projects', async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get projects' });
    }
  });

  // Get project by ID
  router.get('/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (project) {
        res.json(project);
      } else {
        res.status(404).json({ error: 'Project not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get project' });
    }
  });

  // Create new project
  router.post('/projects', async (req, res) => {
    try {
      // Validate request body against schema
      const validation = insertProjectSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid project data',
          details: validation.error.format()
        });
      }
      
      const project = await storage.createProject(validation.data);
      
      // Broadcast project creation
      broadcast({
        type: WebSocketMessageType.PROJECT_UPDATE,
        data: {
          action: 'created',
          project
        }
      });
      
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  // Update project
  router.patch('/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateProject(id, req.body);
      
      if (project) {
        // Broadcast project update
        broadcast({
          type: WebSocketMessageType.PROJECT_UPDATE,
          data: {
            action: 'updated',
            project
          }
        });
        
        res.json(project);
      } else {
        res.status(404).json({ error: 'Project not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  // Delete project
  router.delete('/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      
      if (success) {
        // Broadcast project deletion
        broadcast({
          type: WebSocketMessageType.PROJECT_UPDATE,
          data: {
            action: 'deleted',
            projectId: id
          }
        });
        
        res.status(204).end();
      } else {
        res.status(404).json({ error: 'Project not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  // Get project tasks
  router.get('/projects/:id/tasks', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const tasks = await storage.getTasks(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get project tasks' });
    }
  });

  return router;
}
