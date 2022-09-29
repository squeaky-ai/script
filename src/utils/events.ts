import { eventWithTime } from 'rrweb/typings/types';
import { EventType, IncrementalSource } from 'rrweb';
import type { ClickEvent, PageViewEvent, MouseMoveEvent } from 'types/events';

export const isClickEvent = (
  event: eventWithTime,
): event is ClickEvent => (
  event.type === EventType.IncrementalSnapshot && 
  event.data.source === IncrementalSource.MouseInteraction
);

export const isPageViewEvent = (
  event: eventWithTime,
): event is PageViewEvent => event.type === EventType.Meta;

export const isMouseMoveEvent = (
  event: eventWithTime,
): event is MouseMoveEvent => (
  event.type === EventType.IncrementalSnapshot &&
  event.data.source === IncrementalSource.MouseMove 
);

export const isUserInteractionEvent = (
  event: eventWithTime
): boolean => (
  event.type === EventType.IncrementalSnapshot && 
  [
    IncrementalSource.MouseInteraction,
    IncrementalSource.Scroll
  ].includes(event.data.source)
);
