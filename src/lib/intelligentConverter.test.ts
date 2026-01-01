import { describe, it, expect } from "vitest";
import { IntelligentConverter } from "./intelligentConverter";
import type { BuildOrderStep } from "@/types";

describe("IntelligentConverter", () => {
  it("infers absolute villager counts from descriptions", () => {
    const converter = new IntelligentConverter();
    const step: BuildOrderStep = {
      id: "step-1",
      description: "6 villagers to sheep",
    };

    const refined = converter.processStep(step, 0);
    expect(refined.resources?.food).toBe(6);
    expect(refined.resources?.villagers).toBe(6);
  });

  it("maintains state across steps", () => {
    const converter = new IntelligentConverter();
    
    // Step 1: 6 to sheep
    converter.processStep({ id: "s1", description: "6 to sheep" }, 0);
    
    // Step 2: 3 to gold
    const refined = converter.processStep({ id: "s2", description: "3 to gold" }, 1);
    
    // Step 2 should have 6 on food (from state) and 3 on gold (inferred)
    expect(refined.resources?.food).toBe(6);
    expect(refined.resources?.gold).toBe(3);
    expect(refined.resources?.villagers).toBe(9);
  });

  it("handles various resource aliases", () => {
    const converter = new IntelligentConverter();
    
    const refined = converter.processStep({ 
      id: "s1", 
      description: "Send 2 vills to berries, 4 to lumber and 1 to mining" 
    }, 0);

    expect(refined.resources?.food).toBe(2);
    expect(refined.resources?.wood).toBe(4);
    expect(refined.resources?.gold).toBe(1);
  });

  it("polishes descriptions and expands abbreviations", () => {
    const converter = new IntelligentConverter();
    
    const step1 = converter.processStep({ id: "s1", description: "6 to sheep" }, 0);
    expect(step1.description).toBe("6 villagers to sheep");

    const step2 = converter.processStep({ id: "s2", description: "next 2 to gold" }, 1);
    expect(step2.description).toBe("Send next 2 villagers to gold");

    const step3 = converter.processStep({ id: "s3", description: "Build TC near gold" }, 2);
    expect(step3.description).toBe("Build Town Center near gold");

    const step4 = converter.processStep({ id: "s4", description: "research WB" }, 3);
    expect(step4.description).toBe("Research Wheelbarrow");
  });

  it("preserves existing icon markers while polishing", () => {
    const converter = new IntelligentConverter();
    
    const step = converter.processStep({ id: "s1", description: "6 to [icon:sheep] sheep" }, 0);
    expect(step.description).toBe("6 villagers to [icon:sheep] sheep");
  });

  it("calculates total villagers correctly when partially provided", () => {
    const converter = new IntelligentConverter();
    
    const refined = converter.processStep({ 
      id: "s1", 
      description: "Gather food",
      resources: { food: 10, wood: 5 }
    }, 0);

    expect(refined.resources?.villagers).toBe(15);
  });
});
