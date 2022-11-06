import { eventWithTime } from 'rrweb/typings/types';
import { EventType, IncrementalSource } from 'rrweb';
import type { ClickEvent, PageViewEvent, MouseMoveEvent, ScrollEvent, MutationEvent } from 'types/events';

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

export const isScrollEvent = (
  event: eventWithTime,
): event is ScrollEvent => (
  event.type === EventType.IncrementalSnapshot &&
  event.data.source === IncrementalSource.Scroll
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

export const isMutationEvent = (
  event: eventWithTime
): event is MutationEvent => (
  event.type === EventType.IncrementalSnapshot &&
  event.data.source === IncrementalSource.Mutation
);

export const isMutatingOnlyStyleAttributes = (
  event: MutationEvent
): boolean => {
  // Get a unique list of all of the html attributes that have been modified
  const attributes = Array.from(
    new Set(event.data.attributes.flatMap(attributes => Object.keys(attributes.attributes)))
  );

  return (
    event.data.adds.length === 0 &&
    event.data.removes.length === 0 &&
    event.data.texts.length === 0 &&
    (attributes.length === 1 && attributes[0] === 'style')
  );
};
