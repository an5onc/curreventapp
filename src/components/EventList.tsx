/* Renders a responsive grid of EventItem cards. Updates automatically when the
   events array changes. Shows a friendly empty state when no events exist. */

import React, { useMemo } from 'react';
import EventItem from './EventItem';
import { Event } from '../types/Event';
import { Link } from 'react-router-dom';
import { useEvents } from '../context/EventsContext';

interface EventListProps {
  events?: Event[];
  filters?: {
    category?: string | null;
    isPriced?: boolean | null;
    rsvpRequired?: boolean | null;
    startDate?: string | undefined;
  };
}

const EventList: React.FC<EventListProps> = ({ events: propsEvents, filters }) => {
  const { events: contextEvents } = useEvents();
  const events = propsEvents ?? contextEvents;

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filters?.category && e.category !== filters.category) return false;
      if (filters?.isPriced === true && (!e.price || e.price <= 0)) return false;
      if (filters?.isPriced === false && e.price && e.price > 0) return false;
      if (filters?.rsvpRequired === true && !e.rsvpRequired) return false;
      if (filters?.rsvpRequired === false && e.rsvpRequired) return false;
      if (filters?.startDate && new Date(e.startDate) < new Date(filters.startDate)) return false;
      return true;
    });
  }, [events, filters]);

  if (!filtered || filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-brand-light flex items-center justify-center">
          <span className="text-brand-blue text-lg">🗓️</span>
        </div>
        <p className="text-lg text-brand-bluegrey mb-3">No events found.</p>
        <Link
          to="/create"
          className="inline-block rounded-lg border border-brand-gold bg-brand-gold px-4 py-2 text-sm font-medium text-brand-blue hover:bg-brand-honeycomb"
        >
          Create the first event
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((event) => (
        <EventItem key={event.id} event={event} />
      ))}
    </div>
  );
};

export default EventList;