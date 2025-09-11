import { type User, type InsertUser, type FlowSequence, type InsertFlowSequence, type UpdateFlowSequence } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Flow sequence methods
  getFlowSequence(id: string): Promise<FlowSequence | undefined>;
  getAllFlowSequences(): Promise<FlowSequence[]>;
  createFlowSequence(flowSequence: InsertFlowSequence): Promise<FlowSequence>;
  updateFlowSequence(id: string, flowSequence: UpdateFlowSequence): Promise<FlowSequence | undefined>;
  deleteFlowSequence(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private flowSequences: Map<string, FlowSequence>;

  constructor() {
    this.users = new Map();
    this.flowSequences = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFlowSequence(id: string): Promise<FlowSequence | undefined> {
    return this.flowSequences.get(id);
  }

  async getAllFlowSequences(): Promise<FlowSequence[]> {
    return Array.from(this.flowSequences.values());
  }

  async createFlowSequence(insertFlowSequence: InsertFlowSequence): Promise<FlowSequence> {
    const id = randomUUID();
    const now = new Date();
    const flowSequence: FlowSequence = {
      id,
      name: insertFlowSequence.name,
      description: insertFlowSequence.description || null,
      nodes: insertFlowSequence.nodes,
      edges: insertFlowSequence.edges,
      createdAt: now,
      updatedAt: now,
    };
    this.flowSequences.set(id, flowSequence);
    return flowSequence;
  }

  async updateFlowSequence(id: string, updateData: UpdateFlowSequence): Promise<FlowSequence | undefined> {
    const existingFlow = this.flowSequences.get(id);
    if (!existingFlow) {
      return undefined;
    }

    const updatedFlow: FlowSequence = {
      ...existingFlow,
      ...updateData,
      updatedAt: new Date(),
    };
    this.flowSequences.set(id, updatedFlow);
    return updatedFlow;
  }

  async deleteFlowSequence(id: string): Promise<boolean> {
    return this.flowSequences.delete(id);
  }
}

export const storage = new MemStorage();
