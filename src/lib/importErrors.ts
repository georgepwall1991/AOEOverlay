/**
 * Unified Error Handling for Build Order Imports
 *
 * Provides:
 * - Typed error codes for categorization
 * - User-friendly error messages
 * - Actionable recovery suggestions
 * - Source-specific help URLs
 */

import type { BuildSource } from "./buildOrderRouter";

// ============================================================================
// Error Codes
// ============================================================================

export type ImportErrorCode =
  | "NOT_FOUND"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "INVALID_URL"
  | "INVALID_ID"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "EMPTY_BUILD"
  | "UNKNOWN";

// ============================================================================
// Error Context Types
// ============================================================================

export interface ErrorContext {
  buildId?: string;
  url?: string;
  field?: string;
  expected?: string;
  reason?: string;
  status?: number;
}

// ============================================================================
// ImportError Class
// ============================================================================

export class ImportError extends Error {
  public readonly code: ImportErrorCode;
  public readonly source: BuildSource | string;
  public readonly originalError?: Error;
  public readonly context?: ErrorContext;

  constructor(
    message: string,
    code: ImportErrorCode,
    source: BuildSource | string,
    originalError?: Error,
    context?: ErrorContext
  ) {
    super(message);
    this.name = "ImportError";
    this.code = code;
    this.source = source;
    this.originalError = originalError;
    this.context = context;
  }
}

// ============================================================================
// Source Display Names
// ============================================================================

const SOURCE_NAMES: Record<string, string> = {
  aoe4guides: "AOE4 Guides",
  aoe4world: "AOE4 World",
  age4builder: "Age4Builder",
  text: "text input",
};

function getSourceName(source: string): string {
  return SOURCE_NAMES[source] || source;
}

// ============================================================================
// Error Message Templates
// ============================================================================

interface MessageTemplate {
  message: (source: string, context?: ErrorContext) => string;
}

const ERROR_TEMPLATES: Record<ImportErrorCode, MessageTemplate> = {
  NOT_FOUND: {
    message: (source, ctx) =>
      ctx?.buildId
        ? `Build "${ctx.buildId}" was not found on ${getSourceName(source)}. It may have been deleted or the ID is incorrect.`
        : `The build was not found on ${getSourceName(source)}.`,
  },
  NETWORK_ERROR: {
    message: (source) =>
      `Could not connect to ${getSourceName(source)}. Please check your network connection and try again.`,
  },
  TIMEOUT: {
    message: (source) =>
      `The request to ${getSourceName(source)} timed out. The server may be slow or unresponsive.`,
  },
  RATE_LIMITED: {
    message: (source) =>
      `Too many requests to ${getSourceName(source)}. The rate limit has been reached.`,
  },
  SERVER_ERROR: {
    message: (source, ctx) =>
      ctx?.status
        ? `${getSourceName(source)} returned a server error (${ctx.status}). The service may be temporarily unavailable.`
        : `${getSourceName(source)} is experiencing server issues. Please try again later.`,
  },
  INVALID_URL: {
    message: (source, ctx) =>
      ctx?.url
        ? `The URL "${ctx.url}" is not a valid ${getSourceName(source)} build URL.`
        : `The provided URL is not a valid ${getSourceName(source)} build URL.`,
  },
  INVALID_ID: {
    message: (source, ctx) =>
      ctx?.buildId
        ? `"${ctx.buildId}" is not a valid ${getSourceName(source)} build ID.`
        : `The provided ID is not a valid ${getSourceName(source)} build ID.`,
  },
  PARSE_ERROR: {
    message: (source, ctx) =>
      ctx?.reason
        ? `Failed to parse ${getSourceName(source)} data: ${ctx.reason}`
        : `Failed to parse the ${getSourceName(source)} data. The format may be incorrect.`,
  },
  VALIDATION_ERROR: {
    message: (source, ctx) => {
      if (ctx?.field && ctx?.reason) {
        return `Invalid ${getSourceName(source)} data: "${ctx.field}" ${ctx.reason}.`;
      }
      if (ctx?.field) {
        return `Invalid ${getSourceName(source)} data: problem with "${ctx.field}" field.`;
      }
      return `The ${getSourceName(source)} data failed validation.`;
    },
  },
  EMPTY_BUILD: {
    message: (source) =>
      `The build from ${getSourceName(source)} has no steps. Please provide a build with at least one step.`,
  },
  UNKNOWN: {
    message: (source) =>
      `An unexpected error occurred while importing from ${getSourceName(source)}.`,
  },
};

// ============================================================================
// Create Error Function
// ============================================================================

export function createImportError(
  code: ImportErrorCode,
  source: BuildSource | string,
  context?: ErrorContext,
  originalError?: Error
): ImportError {
  const template = ERROR_TEMPLATES[code];
  const message = template.message(source, context);
  return new ImportError(message, code, source, originalError, context);
}

// ============================================================================
// Formatted Error for UI
// ============================================================================

export interface FormattedError {
  title: string;
  message: string;
  suggestion: string;
  helpUrl?: string;
}

const ERROR_TITLES: Record<ImportErrorCode, string> = {
  NOT_FOUND: "Build Not Found",
  NETWORK_ERROR: "Connection Error",
  TIMEOUT: "Request Timeout",
  RATE_LIMITED: "Rate Limited",
  SERVER_ERROR: "Server Error",
  INVALID_URL: "Invalid URL",
  INVALID_ID: "Invalid ID",
  PARSE_ERROR: "Parse Error",
  VALIDATION_ERROR: "Validation Error",
  EMPTY_BUILD: "Empty Build",
  UNKNOWN: "Import Error",
};

const ERROR_SUGGESTIONS: Record<ImportErrorCode, string> = {
  NOT_FOUND:
    "Please check that the build URL or ID is correct and the build still exists.",
  NETWORK_ERROR:
    "Check your internet connection and try again. If the problem persists, the service may be down.",
  TIMEOUT:
    "Try again in a moment. If the issue continues, the server may be overloaded.",
  RATE_LIMITED:
    "Please wait a moment before trying again. Too many requests were made in a short time.",
  SERVER_ERROR:
    "This is a temporary issue. Please try again later or use an alternative source.",
  INVALID_URL:
    "Make sure you're using a valid build URL. Copy the full URL from the website.",
  INVALID_ID:
    "Verify the build ID is correct. You can find it in the build's URL.",
  PARSE_ERROR:
    "The data format is incorrect. For JSON imports, ensure you're pasting valid JSON from the source.",
  VALIDATION_ERROR:
    "The build data is missing required fields. Ensure the source data is complete.",
  EMPTY_BUILD:
    "The build needs at least one step. Add some steps to the build before importing.",
  UNKNOWN:
    "Try again or import from a different source. If the problem continues, report the issue.",
};

const HELP_URLS: Partial<Record<string, Record<ImportErrorCode, string>>> = {
  aoe4guides: {
    NOT_FOUND: "https://aoe4guides.com",
    INVALID_URL: "https://aoe4guides.com",
    PARSE_ERROR: "https://aoe4guides.com",
  } as Record<ImportErrorCode, string>,
  aoe4world: {
    NOT_FOUND: "https://aoe4world.com/builds",
    INVALID_URL: "https://aoe4world.com/builds",
    PARSE_ERROR: "https://aoe4world.com/builds",
  } as Record<ImportErrorCode, string>,
  age4builder: {
    PARSE_ERROR: "https://age4builder.com",
    VALIDATION_ERROR: "https://age4builder.com",
    INVALID_URL: "https://age4builder.com",
  } as Record<ImportErrorCode, string>,
};

export function formatErrorForUser(error: ImportError): FormattedError {
  const title = ERROR_TITLES[error.code] || "Import Error";
  const suggestion = ERROR_SUGGESTIONS[error.code] || ERROR_SUGGESTIONS.UNKNOWN;
  const helpUrl = HELP_URLS[error.source]?.[error.code];

  return {
    title,
    message: error.message,
    suggestion,
    helpUrl,
  };
}

// ============================================================================
// Error Type Checkers
// ============================================================================

export function isNetworkError(error: ImportError): boolean {
  return error.code === "NETWORK_ERROR" || error.code === "TIMEOUT";
}

export function isNotFoundError(error: ImportError): boolean {
  return error.code === "NOT_FOUND";
}

export function isValidationError(error: ImportError): boolean {
  return error.code === "VALIDATION_ERROR" || error.code === "PARSE_ERROR";
}

// ============================================================================
// Recovery Actions
// ============================================================================

export type RecoveryActionType = "retry" | "verify" | "help" | "wait" | "alternative";

export interface RecoveryAction {
  type: RecoveryActionType;
  label: string;
}

const RECOVERY_ACTIONS: Record<ImportErrorCode, RecoveryAction> = {
  NOT_FOUND: { type: "verify", label: "Verify URL or ID" },
  NETWORK_ERROR: { type: "retry", label: "Retry" },
  TIMEOUT: { type: "retry", label: "Retry" },
  RATE_LIMITED: { type: "wait", label: "Wait and retry" },
  SERVER_ERROR: { type: "alternative", label: "Try alternative source" },
  INVALID_URL: { type: "verify", label: "Verify URL" },
  INVALID_ID: { type: "verify", label: "Verify ID" },
  PARSE_ERROR: { type: "help", label: "View format help" },
  VALIDATION_ERROR: { type: "help", label: "Check required fields" },
  EMPTY_BUILD: { type: "help", label: "Add build steps" },
  UNKNOWN: { type: "retry", label: "Retry" },
};

export function getRecoveryAction(error: ImportError): RecoveryAction {
  return RECOVERY_ACTIONS[error.code] || RECOVERY_ACTIONS.UNKNOWN;
}
