import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFlowSequenceSchema, updateFlowSequenceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all flow sequences
  app.get("/api/flows", async (req, res) => {
    try {
      const flows = await storage.getAllFlowSequences();
      res.json(flows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flow sequences" });
    }
  });

  // Get a specific flow sequence
  app.get("/api/flows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const flow = await storage.getFlowSequence(id);
      
      if (!flow) {
        return res.status(404).json({ message: "Flow sequence not found" });
      }
      
      res.json(flow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flow sequence" });
    }
  });

  // Create a new flow sequence
  app.post("/api/flows", async (req, res) => {
    try {
      const validatedData = insertFlowSequenceSchema.parse(req.body);
      const flow = await storage.createFlowSequence(validatedData);
      res.status(201).json(flow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid flow sequence data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create flow sequence" });
    }
  });

  // Update a flow sequence
  app.put("/api/flows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateFlowSequenceSchema.parse(req.body);
      const flow = await storage.updateFlowSequence(id, validatedData);
      
      if (!flow) {
        return res.status(404).json({ message: "Flow sequence not found" });
      }
      
      res.json(flow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid flow sequence data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update flow sequence" });
    }
  });

  // Delete a flow sequence
  app.delete("/api/flows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFlowSequence(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Flow sequence not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flow sequence" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
