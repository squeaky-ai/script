import type { NodeData, PositionData, AttributeData, TextData } from '../vendor/mutation-summary';

interface PageViewEvent {
  type: 'page_view',
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
}

interface SnapshotEvent {
  type: 'snapshot';
  event: 'initialize' | 'apply_changed';
  snapshot: SnapshotInitializeArgs | SnapshotApplyChangedArgs;
}

type SnapshotInitializeArgs = [number, NodeData[]];

type SnapshotApplyChangedArgs = [NodeData[], PositionData[], AttributeData[], TextData[]];

type InteractionEventType = 'click' | 'hover' | 'focus' | 'blur';

export type Event = PageViewEvent | ScrollEvent | CursorEvent | InteractionEvent | SnapshotEvent;

export type EventWithTimestamps = Event & { time: number; timestamp: number };
