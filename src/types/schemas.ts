import { z } from "zod";

export const ResourcesSchema = z
  .object({
    food: z.number().int().nonnegative().optional(),
    wood: z.number().int().nonnegative().optional(),
    gold: z.number().int().nonnegative().optional(),
    stone: z.number().int().nonnegative().optional(),
  })
  .partial();

export const BuildOrderStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  timing: z.string().optional(),
  resources: ResourcesSchema.optional(),
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
  branches: z.array(BuildOrderBranchSchema).optional(),
});

export function validateBuildOrder(input: unknown) {
  return BuildOrderSchema.parse(input);
}



