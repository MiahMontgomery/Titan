import { Router } from "express";
import { storage } from "../storage";
import { WebSocketMessageType } from "@shared/types";
import { insertAgentSchema } from "@shared/schema";

export function agentController(router: Router, broadcast: (message: any) => void) {
  // Get all agents
  router.get('/agents', async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get agents' });
    }
  });

  // Get agent by ID
  router.get('/agents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      
      if (agent) {
        res.json(agent);
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get agent' });
    }
  });

  // Create new agent
  router.post('/agents', async (req, res) => {
    try {
      // Validate request body against schema
      const validation = insertAgentSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid agent data',
          details: validation.error.format()
        });
      }
      
      const agent = await storage.createAgent(validation.data);
      
      // Broadcast agent creation
      broadcast({
        type: WebSocketMessageType.AGENT_STATUS,
        data: {
          action: 'created',
          agent
        }
      });
      
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create agent' });
    }
  });

  // Update agent
  router.patch('/agents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.updateAgent(id, req.body);
      
      if (agent) {
        // Broadcast agent update
        broadcast({
          type: WebSocketMessageType.AGENT_STATUS,
          data: {
            action: 'updated',
            agent
          }
        });
        
        // Log agent status change if active state changed
        if (req.body.active !== undefined) {
          const status = agent.active ? 'activated' : 'deactivated';
          await storage.createActivityLog({
            agentType: agent.type,
            projectName: "System",
            message: `Agent ${agent.name} has been ${status}`,
            type: agent.active ? 'info' : 'warning'
          });
        }
        
        res.json(agent);
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update agent' });
    }
  });

  // Delete agent
  router.delete('/agents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      const success = await storage.deleteAgent(id);
      
      if (success) {
        // Broadcast agent deletion
        broadcast({
          type: WebSocketMessageType.AGENT_STATUS,
          data: {
            action: 'deleted',
            agentId: id
          }
        });
        
        // Log agent deletion
        await storage.createActivityLog({
          agentType: agent.type,
          projectName: "System",
          message: `Agent ${agent.name} has been deleted`,
          type: 'warning'
        });
        
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete agent' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete agent' });
    }
  });

  return router;
}
