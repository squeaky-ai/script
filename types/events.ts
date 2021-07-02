interface PageViewEvent {
  type: 'pageview',
  path: string;
  viewport_x: number;
  viewport_y: number;
  locale: string;
  useragent: string;
}

interface ScrollEvent {
  type: 'scroll',
  x: number;
  y: number;
}

interface CursorEvent {
  type: 'cursor',
  x: number;
  y: number;
}

interface InteractionEvent {
  type: InteractionEventType;
  selector: string;
  node: string;
}

interface SnapshotEvent {
  type: 'snapshot';
  event: 'initialize' | 'applyChanged';
  snapshot: string;
}

interface VisibilityEvent {
  type: 'visibility';
  visible: boolean;
}

type InteractionEventType = 'click' | 'hover' | 'focus' | 'blur';

export type Event = 
  PageViewEvent | 
  ScrollEvent | 
  CursorEvent | 
  InteractionEvent | 
  SnapshotEvent |
  VisibilityEvent;

export type EventWithTimestamps = Event & { time: number; timestamp: number };
