import { describe, it, expect } from "vitest";
import {
  ImportError,
  ImportErrorCode,
  createImportError,
  formatErrorForUser,
  isNetworkError,
  isNotFoundError,
  isValidationError,
  getRecoveryAction,
} from "./importErrors";

describe("importErrors", () => {
  describe("ImportError class", () => {
    it("creates error with code and source", () => {
      const error = new ImportError("Test error", "NOT_FOUND", "aoe4guides");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.source).toBe("aoe4guides");
      expect(error.name).toBe("ImportError");
    });

    it("includes original error when provided", () => {
      const original = new Error("Network failure");
      const error = new ImportError("Failed to fetch", "NETWORK_ERROR", "aoe4world", original);

      expect(error.originalError).toBe(original);
    });

    it("includes context when provided", () => {
      const error = new ImportError("Parse failed", "PARSE_ERROR", "age4builder", undefined, {
        field: "build_order",
        expected: "array",
      });

      expect(error.context?.field).toBe("build_order");
      expect(error.context?.expected).toBe("array");
    });
  });

  describe("createImportError", () => {
    it("creates NOT_FOUND error for aoe4guides", () => {
      const error = createImportError("NOT_FOUND", "aoe4guides", { buildId: "ABC123" });

      expect(error.code).toBe("NOT_FOUND");
      expect(error.source).toBe("aoe4guides");
      expect(error.message).toContain("ABC123");
      expect(error.message).toContain("not found");
    });

    it("creates NOT_FOUND error for aoe4world", () => {
      const error = createImportError("NOT_FOUND", "aoe4world", { buildId: "12345" });

      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toContain("12345");
    });

    it("creates NETWORK_ERROR with helpful message", () => {
      const error = createImportError("NETWORK_ERROR", "aoe4guides");

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toContain("network");
    });

    it("creates INVALID_URL error", () => {
      const error = createImportError("INVALID_URL", "aoe4guides", {
        url: "https://wrong-site.com/build/123"
      });

      expect(error.code).toBe("INVALID_URL");
      expect(error.message).toContain("URL");
    });

    it("creates PARSE_ERROR for JSON issues", () => {
      const error = createImportError("PARSE_ERROR", "age4builder", {
        reason: "Invalid JSON syntax",
      });

      expect(error.code).toBe("PARSE_ERROR");
      expect(error.message).toContain("Invalid JSON");
    });

    it("creates VALIDATION_ERROR for missing fields", () => {
      const error = createImportError("VALIDATION_ERROR", "age4builder", {
        field: "civilization",
        reason: "missing required field",
      });

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toContain("civilization");
    });

    it("creates EMPTY_BUILD error", () => {
      const error = createImportError("EMPTY_BUILD", "text");

      expect(error.code).toBe("EMPTY_BUILD");
      expect(error.message).toContain("no steps");
    });

    it("creates RATE_LIMITED error", () => {
      const error = createImportError("RATE_LIMITED", "aoe4world");

      expect(error.code).toBe("RATE_LIMITED");
      expect(error.message).toContain("rate");
    });

    it("creates SERVER_ERROR for 5xx responses", () => {
      const error = createImportError("SERVER_ERROR", "aoe4guides", {
        status: 503
      });

      expect(error.code).toBe("SERVER_ERROR");
      expect(error.message).toContain("server");
    });

    it("creates TIMEOUT error", () => {
      const error = createImportError("TIMEOUT", "aoe4world");

      expect(error.code).toBe("TIMEOUT");
      expect(error.message).toContain("timed out");
    });
  });

  describe("formatErrorForUser", () => {
    it("formats NOT_FOUND error with actionable message", () => {
      const error = createImportError("NOT_FOUND", "aoe4guides", { buildId: "ABC123" });
      const formatted = formatErrorForUser(error);

      expect(formatted.title).toBeDefined();
      expect(formatted.message).toBeDefined();
      expect(formatted.suggestion).toBeDefined();
      expect(formatted.suggestion).toContain("check");
    });

    it("formats NETWORK_ERROR with retry suggestion", () => {
      const error = createImportError("NETWORK_ERROR", "aoe4world");
      const formatted = formatErrorForUser(error);

      expect(formatted.suggestion).toMatch(/retry|again|connection/i);
    });

    it("formats PARSE_ERROR with format help", () => {
      const error = createImportError("PARSE_ERROR", "age4builder");
      const formatted = formatErrorForUser(error);

      expect(formatted.suggestion).toContain("JSON");
    });

    it("formats VALIDATION_ERROR with specific field info", () => {
      const error = createImportError("VALIDATION_ERROR", "age4builder", {
        field: "build_order",
      });
      const formatted = formatErrorForUser(error);

      expect(formatted.message).toContain("build_order");
    });

    it("formats RATE_LIMITED with wait suggestion", () => {
      const error = createImportError("RATE_LIMITED", "aoe4world");
      const formatted = formatErrorForUser(error);

      expect(formatted.suggestion).toMatch(/wait|moment|later/i);
    });

    it("includes source-specific help URLs when available", () => {
      const error = createImportError("PARSE_ERROR", "age4builder");
      const formatted = formatErrorForUser(error);

      expect(formatted.helpUrl).toMatch(/age4builder/i);
    });
  });

  describe("error type checkers", () => {
    it("isNetworkError identifies network errors", () => {
      expect(isNetworkError(createImportError("NETWORK_ERROR", "aoe4guides"))).toBe(true);
      expect(isNetworkError(createImportError("TIMEOUT", "aoe4guides"))).toBe(true);
      expect(isNetworkError(createImportError("NOT_FOUND", "aoe4guides"))).toBe(false);
    });

    it("isNotFoundError identifies not found errors", () => {
      expect(isNotFoundError(createImportError("NOT_FOUND", "aoe4world"))).toBe(true);
      expect(isNotFoundError(createImportError("NETWORK_ERROR", "aoe4world"))).toBe(false);
    });

    it("isValidationError identifies validation errors", () => {
      expect(isValidationError(createImportError("VALIDATION_ERROR", "age4builder"))).toBe(true);
      expect(isValidationError(createImportError("PARSE_ERROR", "age4builder"))).toBe(true);
      expect(isValidationError(createImportError("NOT_FOUND", "age4builder"))).toBe(false);
    });
  });

  describe("getRecoveryAction", () => {
    it("suggests retry for network errors", () => {
      const error = createImportError("NETWORK_ERROR", "aoe4guides");
      const action = getRecoveryAction(error);

      expect(action.type).toBe("retry");
      expect(action.label).toBeDefined();
    });

    it("suggests verify for not found errors", () => {
      const error = createImportError("NOT_FOUND", "aoe4world", { buildId: "123" });
      const action = getRecoveryAction(error);

      expect(action.type).toBe("verify");
      expect(action.label).toContain("URL");
    });

    it("suggests format help for parse errors", () => {
      const error = createImportError("PARSE_ERROR", "age4builder");
      const action = getRecoveryAction(error);

      expect(action.type).toBe("help");
    });

    it("suggests wait for rate limit errors", () => {
      const error = createImportError("RATE_LIMITED", "aoe4world");
      const action = getRecoveryAction(error);

      expect(action.type).toBe("wait");
    });

    it("suggests alternative for server errors", () => {
      const error = createImportError("SERVER_ERROR", "aoe4guides");
      const action = getRecoveryAction(error);

      expect(action.type).toBe("alternative");
    });
  });

  describe("error code completeness", () => {
    const allCodes: ImportErrorCode[] = [
      "NOT_FOUND",
      "NETWORK_ERROR",
      "TIMEOUT",
      "RATE_LIMITED",
      "SERVER_ERROR",
      "INVALID_URL",
      "INVALID_ID",
      "PARSE_ERROR",
      "VALIDATION_ERROR",
      "EMPTY_BUILD",
      "UNKNOWN",
    ];

    it("createImportError handles all error codes", () => {
      for (const code of allCodes) {
        const error = createImportError(code, "text");
        expect(error.code).toBe(code);
        expect(error.message).toBeTruthy();
      }
    });

    it("formatErrorForUser handles all error codes", () => {
      for (const code of allCodes) {
        const error = createImportError(code, "text");
        const formatted = formatErrorForUser(error);

        expect(formatted.title).toBeTruthy();
        expect(formatted.message).toBeTruthy();
        expect(formatted.suggestion).toBeTruthy();
      }
    });

    it("getRecoveryAction handles all error codes", () => {
      for (const code of allCodes) {
        const error = createImportError(code, "text");
        const action = getRecoveryAction(error);

        expect(action.type).toBeTruthy();
        expect(action.label).toBeTruthy();
      }
    });
  });
});
