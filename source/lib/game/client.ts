// Client-only helpers. Keep this module independent of the server game engine.
export class GameRequestError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export type Session = { code: string; token: string };
export function readSavedSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value.code === 'string' && /^[A-Z2-9]{6}$/.test(value.code) &&
      typeof value.token === 'string' && value.token.length > 0
      ? { code: value.code, token: value.token } : null;
  } catch { return null; }
}

export type SnapshotOrder = { code: string; revision: number; requestId: number };
export function shouldApplySnapshot(previous: SnapshotOrder | null, next: SnapshotOrder) {
  if (!previous || previous.code !== next.code) return true;
  if (next.revision !== previous.revision) return next.revision > previous.revision;
  return next.requestId >= previous.requestId;
}
