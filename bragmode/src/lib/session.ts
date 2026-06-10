export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('bragmode_session_id');
  if (!sessionId) {
    // Generate a secure UUID or fallback to random string
    sessionId = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('bragmode_session_id', sessionId);
  }
  return sessionId;
}
