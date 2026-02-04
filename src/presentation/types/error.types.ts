export type ErrorResponse = {
	success: false;
	error: {
		code: string;
		message: string;
		details?: Record<string, string[]>;
	};
};
