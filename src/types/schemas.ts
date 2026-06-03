import { z } from "zod";

export const ResourcesSchema = z
  .object({
    food: z.number().int().nonnegative().optional(),
    wood: z.number().int().nonnegative().optional(),
    gold: z.number().int().nonnegative().optional(),
    stone: z.number().int().nonnegative().optional(),
    villagers: z.number().int().nonnegative().optional(),
    builders: z.number().int().nonnegative().optional(),
  })
  .partial();

export const BuildOrderStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  timing: z.string().optional(),
  resources: ResourcesSchema.optional(),
});

export const BuildOrderSourceSchema = z.object({
  type: z.enum(["bundled", "aoe4world", "aoe4guides", "rtsbuilds", "age4builder", "manual"]),
  url: z.string().optional(),
  importedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  rawCivilization: z.string().optional(),
});

export const BuildOrderBranchSchema = z.object({
  id: z.string(),
  name: z.string(),
  trigger: z.string().optional(),
  startStepIndex: z.number().int().nonnegative().default(0),
  steps: z.array(BuildOrderStepSchema),
});

export const BuildOrderSchema = z.object({
  id: z.string(),
  name: z.string(),
  civilization: z.string(),
  description: z.string(),
  difficulty: z.string(),
  steps: z.array(BuildOrderStepSchema).min(1),
  enabled: z.boolean(),
  pinned: z.boolean().optional(),
  favorite: z.boolean().optional(),
  branches: z.array(BuildOrderBranchSchema).optional(),
  source: BuildOrderSourceSchema.optional(),
  contentVersion: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});




