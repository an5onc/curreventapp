import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Event } from '../types/Event';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';

interface User {
  id: number;
  [key: string]: any;
}

interface EventsContextProps {
  events: Event[];
  addEvent: (event: Omit<Event, 'id' | 'likes' | 'rsvps' | 'userLiked' | 'userRsvped' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  toggleRsvp: (id: string) => Promise<void>;
  currentUser: User | null;
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextProps | undefined>(undefined);

export const useEvents = (): EventsContextProps => {
  const context = useContext(EventsContext);
  if (!context) throw new Error('useEvents must be used within an EventsProvider');
  return context;
};

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Set currentUser once AuthContext is ready
  useEffect(() => {
    if (!initialized) return;
    setCurrentUser(user ? { ...user, id: Number(user.id) } : null);
  }, [user, initialized]);

  // Helper to format date for backend
  const toBackendDateTime = (dt: string | Date) => {
    const d = dt instanceof Date ? dt : new Date(dt);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Fetch events once currentUser is available
  const fetchEvents = useCallback(async () => {
    if (!currentUser) return; // Wait for currentUser

    try {
      const url = new URL(`${API_BASE_URL}/events`);
      url.searchParams.set('user_id', String(currentUser.id));

      const res = await fetch(url.toString());
      if (!res.ok) return console.error('Failed to fetch events', res.statusText);

      const data = await res.json();
      const mapped: Event[] = (data as any[]).map(evt => ({
        id: String(evt.id),
        title: evt.title,
        description: evt.description,
        startDate: evt.startDate,
        endDate: evt.endDate,
        location: evt.location,
        categories: evt.categories ?? (evt.category ? [evt.category] : []),
        category: evt.category ?? (evt.categories?.[0] ?? 'Other'),
        likes: Number(evt.likes ?? 0),
        rsvps: Array.isArray(evt.rsvps) ? evt.rsvps.length : Number(evt.rsvps ?? 0),
        userLiked: Boolean(evt.userLiked),
        userRsvped: Boolean(evt.userRsvped),
        createdAt: evt.startDate,
        updatedAt: evt.endDate ?? evt.startDate,
        price: evt.price,
        rsvpRequired: evt.rsvpRequired,
        isPrivate: evt.eventAccess === 'Private',
        creatorID: evt.creatorID,
        imageUrl: evt.imageUrl ?? undefined,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error('Error loading events', err);
    }
  }, [currentUser]);

  // Fetch events whenever currentUser changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Add a new event
  const addEvent = async (data: Omit<Event, 'id' | 'likes' | 'rsvps' | 'userLiked' | 'userRsvped' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    try {
      const payload = {
        creatorID: currentUser.id,
        title: data.title,
        description: data.description,
        location: data.location,
        eventType: data.categories?.[0] || 'Other',
        startDateTime: toBackendDateTime(data.startDate),
        endDateTime: data.endDate ? toBackendDateTime(data.endDate) : toBackendDateTime(data.startDate),
        eventAccess: data.isPrivate ? 'Private' : 'Public',
        rsvpRequired: Boolean(data.rsvpRequired),
        isPriced: Boolean(data.price && data.price > 0),
        cost: data.price && data.price > 0 ? data.price : null,
        categories: data.categories ?? undefined,
      };
      const res = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to create event: ${res.statusText}`);
      const result = await res.json();
      await fetchEvents();
      return typeof result?.eventID === 'number' ? String(result.eventID) : undefined;
    } catch (err) {
      console.error(err);
    }
  };

  // Update event
  const updateEvent = async (updated: Event) => {
    if (!currentUser) return;
    try {
      const payload: any = {
        updaterID: currentUser.id,
        title: updated.title,
        description: updated.description,
        location: updated.location,
        eventType: updated.categories?.[0] || updated.category,
        startDateTime: updated.startDate ? toBackendDateTime(updated.startDate) : undefined,
        endDateTime: updated.endDate ? toBackendDateTime(updated.endDate) : undefined,
        eventAccess: updated.isPrivate ? 'Private' : 'Public',
        rsvpRequired: updated.rsvpRequired,
        isPriced: updated.price && updated.price > 0,
        cost: updated.price && updated.price > 0 ? updated.price : undefined,
      };
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      const res = await fetch(`${API_BASE_URL}/events/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to update event: ${res.statusText}`);
      await fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    if (!currentUser) return;
    try {
      const url = new URL(`${API_BASE_URL}/events/${id}`);
      url.searchParams.set('user_id', String(currentUser.id));
      url.searchParams.set('hard', 'false');
      const res = await fetch(url.toString(), { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete event: ${res.statusText}`);
      await fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle like
  const toggleLike = async (id: string) => {
    if (!currentUser) return;
    const event = events.find(e => e.id === id);
    if (!event) return;
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}/like`, {
        method: event.userLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });
      if (!res.ok) throw new Error(`Failed to toggle like: ${res.statusText}`);
      const data = await res.json();
      setEvents(prev =>
        prev.map(e =>
          e.id === id ? { ...e, likes: Number(data.likes ?? e.likes), userLiked: !event.userLiked } : e
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle RSVP
  const toggleRsvp = async (id: string) => {
    if (!currentUser) return;
    const event = events.find(e => e.id === id);
    if (!event) return;
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}/rsvp`, {
        method: event.userRsvped ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });
      if (!res.ok) throw new Error(`Failed to toggle RSVP: ${res.statusText}`);
      const data = await res.json();
      const rsvpsCount = Array.isArray(data.rsvps) ? data.rsvps.length : event.rsvps;
      setEvents(prev =>
        prev.map(e =>
          e.id === id ? { ...e, rsvps: rsvpsCount, userRsvped: !event.userRsvped } : e
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const refreshEvents = async () => {
    await fetchEvents();
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        toggleLike,
        toggleRsvp,
        currentUser,
        refreshEvents,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};
