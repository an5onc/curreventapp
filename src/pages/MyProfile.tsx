import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import EventItem from '../components/EventItem';

const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const { events } = useEvents();

  console.log("Loaded events:", events);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">My profile</h1>
        <p className="text-gray-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  const userId = String(user.id);

  const createdEvents = events.filter(
    (ev: any) => Number(ev.creatorID) === Number(user.id)
  );

  const rsvpedEvents = events.filter(
    (ev: any) => Boolean(ev.userRsvped) && String(ev.creatorID || ev.creatorId || ev.createdBy) !== userId
  );

  const Section: React.FC<{ title: string; events: any[] }> = ({ title, events }) => (
    <section className="max-w-5xl mx-auto mb-10">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {events.length === 0 ? (
        <p className="text-sm text-gray-500">None yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <EventItem key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-600 mt-1">{user.email}</p>
      </header>
      <Section title="Events I Created" events={createdEvents} />
      <Section title="Events I RSVP’d To" events={rsvpedEvents} />
    </div>
  );
};

export default MyProfile;