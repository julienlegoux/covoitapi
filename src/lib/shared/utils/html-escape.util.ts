/**
 * Escapes HTML special characters to prevent XSS in email templates.
 * @param str - The string to escape.
 * @returns The escaped string safe for HTML interpolation.
 */
export function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
