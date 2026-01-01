/**
 * Build Order Router
 * Unified import function that auto-detects the source and routes to the appropriate parser.
 * Supports: aoe4guides.com, aoe4world.com, age4builder.com JSON, and plain text.
 */

import type { BuildOrder } from "@/types";
import { importAoe4GuidesBuild } from "./aoe4guides";
import { importAoe4WorldBuild } from "./aoe4world";
import { importAge4Builder } from "./age4builder";
import { parseTextBuildOrder } from "./textParser";

// ============================================================================
// Types
// ============================================================================

export type BuildSource = "aoe4guides" | "aoe4world" | "age4builder" | "text";

export interface ImportOptions {
  /** Override auto-detection and force a specific source */
  source?: BuildSource;
  /** Custom name for text imports */
  name?: string;
}

// ============================================================================
// Detection Patterns
// ============================================================================

// URL patterns
const AOE4GUIDES_URL_PATTERN = /aoe4guides\.com\/build\/([a-zA-Z0-9]+)/i;
const AOE4WORLD_URL_PATTERN = /aoe4world\.com\/builds\/(\d+)/i;

// ID patterns
// aoe4guides IDs are alphanumeric, typically 10-25 chars, must contain letters
// We accept 8+ chars to be lenient with variations
const AOE4GUIDES_ID_PATTERN = /^[a-zA-Z0-9]{8,30}$/;
// aoe4world IDs are purely numeric
const AOE4WORLD_ID_PATTERN = /^\d+$/;

// ============================================================================
// Detection Logic
// ============================================================================

/**
 * Detect the source of a build order input.
 * Examines URLs, JSON structure, and text patterns to determine the source.
 */
export function detectBuildSource(input: string): BuildSource {
  const trimmed = input.trim();

  if (!trimmed) {
    return "text";
  }

  // Check for aoe4guides.com URL
  if (AOE4GUIDES_URL_PATTERN.test(trimmed)) {
    return "aoe4guides";
  }

  // Check for aoe4world.com URL
  if (AOE4WORLD_URL_PATTERN.test(trimmed)) {
    return "aoe4world";
  }

  // Check for pure numeric ID (aoe4world)
  if (AOE4WORLD_ID_PATTERN.test(trimmed)) {
    return "aoe4world";
  }

  // Check for alphanumeric ID with at least one letter (aoe4guides)
  if (AOE4GUIDES_ID_PATTERN.test(trimmed) && /[a-zA-Z]/.test(trimmed)) {
    return "aoe4guides";
  }

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(trimmed);

    // Check if it's age4builder format (has build_order array)
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.build_order) &&
      parsed.build_order.length > 0
    ) {
      return "age4builder";
    }
  } catch {
    // Not valid JSON, continue to text detection
  }

  // Default to text parser
  return "text";
}

// ============================================================================
// Import Router
// ============================================================================

/**
 * Convert input from any supported source to a BuildOrder.
 * Auto-detects the source unless explicitly specified in options.
 *
 * @param input - URL, ID, JSON string, or plain text build order
 * @param options - Optional settings to override detection or provide metadata
 * @returns Promise resolving to a BuildOrder
 * @throws Error if conversion fails with descriptive message
 */
export async function convertBuildInput(
  input: string,
  options?: ImportOptions
): Promise<BuildOrder> {
  const source = options?.source ?? detectBuildSource(input);

  switch (source) {
    case "aoe4guides":
      return importAoe4GuidesBuild(input);

    case "aoe4world":
      return importAoe4WorldBuild(input);

    case "age4builder":
      return importAge4Builder(input);

    case "text":
    default:
      return parseTextBuildOrder(input, options?.name);
  }
}

/**
 * Get a human-readable description of what source was detected.
 * Useful for UI feedback.
 */
export function getSourceDescription(source: BuildSource): string {
  switch (source) {
    case "aoe4guides":
      return "AOE4 Guides (aoe4guides.com)";
    case "aoe4world":
      return "AOE4 World (aoe4world.com)";
    case "age4builder":
      return "Age4Builder JSON";
    case "text":
      return "Plain text format";
    default:
      return "Unknown format";
  }
}

/**
 * Validate that input is valid for a given source without actually importing.
 * Returns an error message if invalid, or null if valid.
 */
export function validateInput(input: string, source?: BuildSource): string | null {
  const detectedSource = source ?? detectBuildSource(input);
  const trimmed = input.trim();

  switch (detectedSource) {
    case "aoe4guides": {
      // Check URL or ID format
      const urlMatch = trimmed.match(AOE4GUIDES_URL_PATTERN);
      const idMatch = trimmed.match(AOE4GUIDES_ID_PATTERN);

      if (!urlMatch && !idMatch) {
        return "Invalid AOE4 Guides input. Use a URL like https://aoe4guides.com/build/ABC123 or paste the build ID.";
      }
      return null;
    }

    case "aoe4world": {
      // Check URL or numeric ID format
      const urlMatch = trimmed.match(AOE4WORLD_URL_PATTERN);
      const idMatch = trimmed.match(AOE4WORLD_ID_PATTERN);

      if (!urlMatch && !idMatch) {
        return "Invalid AOE4 World input. Use a URL like https://aoe4world.com/builds/123 or paste the numeric build ID.";
      }
      return null;
    }

    case "age4builder": {
      try {
        const parsed = JSON.parse(trimmed);

        if (!parsed || typeof parsed !== "object") {
          return "Invalid JSON format. Expected an object.";
        }

        if (!parsed.name) {
          return 'Missing "name" field in age4builder JSON.';
        }

        if (!parsed.civilization) {
          return 'Missing "civilization" field in age4builder JSON.';
        }

        if (!Array.isArray(parsed.build_order) || parsed.build_order.length === 0) {
          return 'Missing or empty "build_order" array in age4builder JSON.';
        }

        return null;
      } catch {
        return "Invalid JSON syntax. Please paste valid JSON from age4builder.com.";
      }
    }

    case "text": {
      if (!trimmed) {
        return "Empty input. Please paste a build order.";
      }

      // Text is always "valid" - we'll do our best to parse it
      return null;
    }

    default:
      return "Unknown source format.";
  }
}
