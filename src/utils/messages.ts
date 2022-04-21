import type { Message } from '../types/message';

export function parseMessage(message: string): Message {
  try {
    return <Message>JSON.parse(message);
  } catch {
    return { key: '__squeaky_unknown', value: {} };
  }
}

export const getMessageFromEvent = <T>(messageEvent: MessageEvent<string>): T | null => {
  try {
    return JSON.parse(messageEvent.data);
  } catch {
    return null;
  }
};
