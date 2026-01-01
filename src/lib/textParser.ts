/**
 * Enhanced Generic Text Build Order Parser
 * Attempts to extract a structured build order from a block of raw text.
 *
 * Supports formats like:
 * - "(6/0/0/0) 00:00: Action"
 * - "0:45 - Build house"
 * - "Step 1: 6 on sheep"
 * - "F6 W4 G2 S0 - Build barracks" (resource shorthand)
 * - "10v - Age up" (villager shorthand)
 * - "Pop: 22 - Feudal" (population prefix)
 * - "@@Dark Age@@" (FluffyMaguro age markers)
 * - "[Feudal Age]" (bracket age markers)
 * - "--- Castle Age ---" (separator age markers)
 */

import { CIVILIZATIONS, type BuildOrder, type BuildOrderStep, type Civilization } from "@/types";
import { BuildOrderSchema } from "@/types";
import { IntelligentConverter } from "./intelligentConverter";

interface ParsedResources {
  food?: number;
  wood?: number;
  gold?: number;
  stone?: number;
  villagers?: number;
}

// ============================================================================
// Age Marker Detection
// ============================================================================

/**
 * Detect if a line is an age marker/separator
 * Returns the age name if detected, null otherwise
 */
export function detectAgeMarker(text: string): string | null {
  const trimmed = text.trim();

  // @@Age@@ format (FluffyMaguro style)
  const atAtMatch = trimmed.match(/^@@(.+?)@@$/);
  if (atAtMatch) {
    return atAtMatch[1];
  }

  // [Age] bracket format
  const bracketMatch = trimmed.match(/^\[([^\]]+)\]$/);
  if (bracketMatch) {
    const content = bracketMatch[1];
    // Only if it looks like an age
    if (/age|feudal|castle|imperial|dark/i.test(content)) {
      return content;
    }
  }

  // --- Age --- separator format
  const dashMatch = trimmed.match(/^-{2,}\s*(.+?)\s*-{2,}$/);
  if (dashMatch) {
    const content = dashMatch[1];
    if (/age|feudal|castle|imperial|dark/i.test(content)) {
      return content;
    }
  }

  // === AGE UP === format
  const equalsMatch = trimmed.match(/^={2,}\s*(.+?)\s*={2,}$/);
  if (equalsMatch) {
    return equalsMatch[1];
  }

  return null;
}

// ============================================================================
// Resource Shorthand Parsing
// ============================================================================

/**
 * Parse resource shorthand formats like:
 * - "F6 W4 G2 S0" (uppercase)
 * - "6f 4w 2g 0s" (lowercase/number first)
 * - "10v" (villager count)
 * - "Pop: 22" (population prefix)
 */
export function parseResourceShorthand(text: string): ParsedResources | null {
  const resources: ParsedResources = {};
  let found = false;

  // Pattern: F6, W4, G2, S0 (letter followed by number)
  const upperPatterns = [
    { key: "food", re: /\bF(\d+)\b/i },
    { key: "wood", re: /\bW(\d+)\b/i },
    { key: "gold", re: /\bG(\d+)\b/i },
    { key: "stone", re: /\bS(\d+)\b/i },
  ];

  for (const p of upperPatterns) {
    const m = text.match(p.re);
    if (m) {
      resources[p.key as keyof ParsedResources] = parseInt(m[1], 10);
      found = true;
    }
  }

  // Pattern: 6f, 4w, 2g, 0s (number followed by letter)
  const lowerPatterns = [
    { key: "food", re: /\b(\d+)f\b/i },
    { key: "wood", re: /\b(\d+)w\b/i },
    { key: "gold", re: /\b(\d+)g\b/i },
    { key: "stone", re: /\b(\d+)s\b/i },
  ];

  for (const p of lowerPatterns) {
    const m = text.match(p.re);
    if (m && resources[p.key as keyof ParsedResources] === undefined) {
      resources[p.key as keyof ParsedResources] = parseInt(m[1], 10);
      found = true;
    }
  }

  // Villager shorthand: 10v or 10V
  const villagerMatch = text.match(/\b(\d+)[vV]\b/);
  if (villagerMatch) {
    resources.villagers = parseInt(villagerMatch[1], 10);
    found = true;
  }

  // Pop: prefix - "Pop: 22" or "pop 22"
  const popMatch = text.match(/\bpop:?\s*(\d+)/i);
  if (popMatch) {
    resources.villagers = parseInt(popMatch[1], 10);
    found = true;
  }

  return found ? resources : null;
}

// ============================================================================
// Civilization Detection
// ============================================================================

/**
 * Detect civilization from text
 */
function detectCivilization(text: string): Civilization {
  const lowerText = text.toLowerCase();

  for (const civ of CIVILIZATIONS) {
    if (lowerText.includes(civ.toLowerCase())) {
      return civ;
    }
  }

  // Check for common abbreviations
  const abbrevMap: Record<string, Civilization> = {
    "hre": "Holy Roman Empire",
    "eng": "English",
    "fre": "French",
    "chi": "Chinese",
    "mon": "Mongols",
    "del": "Delhi Sultanate",
    "abb": "Abbasid Dynasty",
    "ott": "Ottomans",
    "jap": "Japanese",
    "byz": "Byzantines",
    "mal": "Malians",
  };

  for (const [abbrev, civ] of Object.entries(abbrevMap)) {
    if (new RegExp(`\\b${abbrev}\\b`, "i").test(text)) {
      return civ;
    }
  }

  return "English"; // Default
}

// ============================================================================
// Resource Block Parsing (Slash Format)
// ============================================================================

/**
 * Attempt to parse a resource block like "(6/0/0/0)" or natural language like "6 on food"
 */
function parseResourceBlock(text: string): ParsedResources | null {
  // First try shorthand format
  const shorthand = parseResourceShorthand(text);
  if (shorthand) {
    return shorthand;
  }

  // Slash format: (6/3/0/0) or 6/3/0/0
  const slashPattern = /\(?(\d+)\/(\d+)\/(\d+)\/(\d+)\)?/;
  const slashMatch = text.match(slashPattern);

  if (slashMatch) {
    return {
      food: parseInt(slashMatch[1], 10),
      wood: parseInt(slashMatch[2], 10),
      gold: parseInt(slashMatch[3], 10),
      stone: parseInt(slashMatch[4], 10),
    };
  }

  // Natural language detection (e.g., "6 on food", "3 to gold")
  const resources: ParsedResources = {};
  let found = false;

  const patterns = [
    { key: "food", re: /(\d+)\s*(?:on|to|vills?\s+on|vills?\s+to|at)\s*(?:food|sheep|berries|hunt|deer|boar|fish)/i },
    { key: "wood", re: /(\d+)\s*(?:on|to|vills?\s+on|vills?\s+to|at)\s*(?:wood|lumber|trees)/i },
    { key: "gold", re: /(\d+)\s*(?:on|to|vills?\s+on|vills?\s+to|at)\s*(?:gold|mine|miners)/i },
    { key: "stone", re: /(\d+)\s*(?:on|to|vills?\s+on|vills?\s+to|at)\s*(?:stone|rock)/i },
    { key: "villagers", re: /(\d+)\s*(?:total\s*)?vills?\b/i },
  ];

  for (const p of patterns) {
    const m = text.match(p.re);
    if (m) {
      resources[p.key as keyof ParsedResources] = parseInt(m[1], 10);
      found = true;
    }
  }

  return found ? resources : null;
}

// ============================================================================
// Timestamp Parsing
// ============================================================================

/**
 * Attempt to parse a timestamp like "0:45", "00:45", "[2:30]", "@3:00", "~5:00"
 */
function parseTimestamp(text: string): string | null {
  // Pattern: optional prefix (@, ~, [) then mm:ss, optional suffix (])
  const pattern = /[@~\[]?(\d{1,2}:\d{2})\]?/;
  const match = text.match(pattern);
  return match ? match[1] : null;
}

// ============================================================================
// Text Cleanup
// ============================================================================

/**
 * Clean up and normalize a line of text
 */
function cleanLine(line: string): string {
  let cleaned = line;

  // Strip HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Remove markdown bold/italic markers
  cleaned = cleaned.replace(/\*\*/g, "").replace(/\*/g, "").replace(/__/g, "");

  // Remove resource shorthand patterns from description (they're parsed separately)
  cleaned = cleaned.replace(/\b[FfWwGgSs]\d+\b/g, "");
  cleaned = cleaned.replace(/\b\d+[fwgsvFWGSV]\b/g, "");
  cleaned = cleaned.replace(/\bpop:?\s*\d+/gi, "");

  // Remove slash format resources
  cleaned = cleaned.replace(/\(?\d+\/\d+\/\d+\/\d+\)?/g, "");

  // Remove timestamps
  cleaned = cleaned.replace(/[@~\[]?\d{1,2}:\d{2}\]?/g, "");

  // Remove leading bullet points, dashes, numbers, and markers
  cleaned = cleaned.replace(/^[-*•·]\s*/g, "");
  cleaned = cleaned.replace(/^\d+\.\s*/g, ""); // "1. "
  cleaned = cleaned.replace(/^Step\s+\d+:?\s*/i, ""); // "Step 1: "

  // Remove leading/trailing separators and whitespace
  cleaned = cleaned.replace(/^[-:*.\s]+/, "").trim();
  cleaned = cleaned.replace(/[-:*.\s]+$/, "").trim();

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned;
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Main parsing logic
 */
export function parseTextBuildOrder(text: string, name = "Pasted Build"): BuildOrder {
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const lines = normalizedText.split("\n");
  const steps: BuildOrderStep[] = [];
  let stepId = 1;
  const intelligentConverter = new IntelligentConverter();

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip very short or empty lines
    if (!trimmedLine || trimmedLine.length < 3) continue;

    // Check for age marker
    const ageMarker = detectAgeMarker(trimmedLine);
    if (ageMarker) {
      // Create a step for the age marker
      const step: BuildOrderStep = {
        id: `step-${stepId++}`,
        description: `[${ageMarker}]`,
      };
      steps.push(step);
      continue;
    }

    // Try to extract metadata from the line
    const resources = parseResourceBlock(trimmedLine);
    const timing = parseTimestamp(trimmedLine);

    // Clean description
    let description = cleanLine(trimmedLine);

    // If description is empty after removing metadata, skip or use a placeholder
    if (!description && !resources) continue;
    if (!description && resources) {
      description = "Update villager distribution";
    }

    // Capitalize first letter if not already and not an icon marker
    if (description.length > 0 && !description.startsWith("[icon:")) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }

    const step = intelligentConverter.processStep(
      {
        id: `step-${stepId++}`,
        description,
        timing: timing || undefined,
        resources: resources || undefined,
      },
      stepId - 2
    );

    steps.push(step);
  }

  const converted: BuildOrder = {
    id: `text-${Date.now()}`,
    name,
    civilization: detectCivilization(text),
    description: "Imported from text",
    difficulty: "Intermediate",
    enabled: true,
    steps,
  };

  return BuildOrderSchema.parse(converted) as BuildOrder;
}
