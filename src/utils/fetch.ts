/**
 * Enhanced fetch function that adds ngrok-skip-browser-warning header
 * to bypass ngrok's browser warning page
 */
export async function fetchWithHeaders(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const headers = new Headers(options?.headers);
  
  // Add ngrok-skip-browser-warning header
  headers.set('ngrok-skip-browser-warning', 'true');
  
  return fetch(url, {
    ...options,
    headers,
  });
}
