import { Router } from "express";
import { storage } from "../storage";
import { WebSocketMessageType, ActivityLogType } from "@shared/types";
import { z } from "zod";

// Validation schema for automation requests
const automationSchema = z.object({
  url: z.string().url(),
  script: z.string().optional(),
  taskId: z.number().optional()
});

export function automationController(router: Router, broadcast: (message: any) => void) {
  // Start automation
  router.post('/automation/run', async (req, res) => {
    try {
      // Validate request body
      const validation = automationSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid automation data',
          details: validation.error.format()
        });
      }
      
      const { url, script, taskId } = validation.data;
      
      // Log the automation start
      const log = await storage.createActivityLog({
        agentType: "SYSTEM",
        projectName: "Web Automation",
        message: `Starting web automation for URL: ${url}`,
        type: ActivityLogType.INFO
      });
      
      // Broadcast the log
      broadcast({
        type: WebSocketMessageType.ACTIVITY_LOG,
        data: log
      });
      
      // In a real implementation, this would start a Puppeteer task
      // For now, we'll just respond with a success message
      res.json({ 
        success: true,
        message: 'Automation started',
        automationId: Date.now()
      });
      
      // Simulate automation progress and completion
      setTimeout(async () => {
        const completionLog = await storage.createActivityLog({
          agentType: "SYSTEM",
          projectName: "Web Automation",
          message: `Completed web automation for URL: ${url}`,
          type: ActivityLogType.SUCCESS
        });
        
        broadcast({
          type: WebSocketMessageType.ACTIVITY_LOG,
          data: completionLog
        });
      }, 5000);
      
    } catch (error) {
      console.error('Automation error:', error);
      res.status(500).json({ error: 'Failed to start automation' });
    }
  });

  // Stop automation
  router.post('/automation/stop', async (req, res) => {
    try {
      const { automationId } = req.body;
      
      if (!automationId) {
        return res.status(400).json({ error: 'Missing automationId' });
      }
      
      // Log the automation stop
      const log = await storage.createActivityLog({
        agentType: "SYSTEM",
        projectName: "Web Automation",
        message: `Stopped web automation #${automationId}`,
        type: ActivityLogType.WARNING
      });
      
      // Broadcast the log
      broadcast({
        type: WebSocketMessageType.ACTIVITY_LOG,
        data: log
      });
      
      // In a real implementation, this would stop the Puppeteer task
      res.json({ 
        success: true,
        message: 'Automation stopped' 
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop automation' });
    }
  });

  // Get automation status
  router.get('/automation/:id', async (req, res) => {
    try {
      const id = req.params.id;
      
      // In a real implementation, this would get the status of a Puppeteer task
      res.json({ 
        automationId: id,
        status: 'completed',
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(),
        results: {
          success: true,
          screenshots: 0,
          actions: 5
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to get automation status' });
    }
  });

  return router;
}
