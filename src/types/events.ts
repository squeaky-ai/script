import { eventWithTime, incrementalSnapshotEvent, metaEvent, mousemoveData, mutationData, scrollData } from 'rrweb/typings/types';

export type ClickEvent = eventWithTime & {
  data: {
    id: number;
    x: number;
    y: number;
    selector: string;
    href: string;
    text: string | null;
    relativeToElementX: number;
    relativeToElementY: number;
  };
};

export type PageViewEvent = eventWithTime & metaEvent;

export type MouseMoveEvent = eventWithTime & incrementalSnapshotEvent & {
  data: mousemoveData & {
    href: string;
  };
};

export type ScrollEvent = eventWithTime & incrementalSnapshotEvent & {
  data: scrollData & {
    href: string;
  };
};

export type MutationEvent = eventWithTime & incrementalSnapshotEvent & {
  data: mutationData;
}
