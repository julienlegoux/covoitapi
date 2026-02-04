// Re-export all Result utilities
export * from './result.js';

// API Response type for HTTP responses
export type ApiResponse<T = unknown> = {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: Record<string, string[]>;
	};
};
