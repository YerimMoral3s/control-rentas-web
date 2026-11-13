import type { Account, SessionTokens } from '@api/auth';

/**
 * Aviso entre pestañas del mismo navegador. Solo viaja la sesión, nunca lo capturado
 * en formularios (Guía UX, "Otra pestaña").
 */
export type SessionMessage =
  | { type: 'session'; account: Account; session: SessionTokens }
  | { type: 'logout'; accountId: string };

const CHANNEL_NAME = 'rentario-session';

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);

export const broadcastSession = (message: SessionMessage) => channel?.postMessage(message);

export const listenSessionChannel = (onMessage: (message: SessionMessage) => void) => {
  if (!channel) return () => undefined;
  const handler = (event: MessageEvent<SessionMessage>) => onMessage(event.data);
  channel.addEventListener('message', handler);
  return () => channel.removeEventListener('message', handler);
};
