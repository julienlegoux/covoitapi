import type { Context, Next } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import { DomainError } from "../../domain/errors/domain.errors.js";
import { ApplicationError } from "../../application/errors/application.errors.js";

type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
};

export async function errorHandler(
  c: Context,
  next: Next
): Promise<Response | void> {
  try {
    await next();
  } catch (error) {
    const response = buildErrorResponse(error);
    const status = getStatusCode(error);
    return c.json(response, status as ContentfulStatusCode);
  }
}

function buildErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    }
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
      },
    };
  }

  if (error instanceof DomainError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (error instanceof ApplicationError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  console.error("Unexpected error:", error);
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  };
}

function getStatusCode(error: unknown): number {
  if (error instanceof ZodError) {
    return 400;
  }

  if (error instanceof DomainError) {
    switch (error.code) {
      case "USER_ALREADY_EXISTS":
        return 400;
      case "INVALID_CREDENTIALS":
        return 401;
      case "USER_NOT_FOUND":
        return 404;
      default:
        return 400;
    }
  }

  if (error instanceof ApplicationError) {
    switch (error.code) {
      case "VALIDATION_ERROR":
        return 400;
      case "NOT_FOUND":
        return 404;
      default:
        return 400;
    }
  }

  return 500;
}
