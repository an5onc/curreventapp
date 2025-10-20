import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EditEventForm from '../components/EditEventForm';
import { useEvents } from '../context/EventsContext';

const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { events } = useEvents();
  const [eventData, setEventData] = useState<any | null>(null);

  useEffect(() => {
    const found = events.find(e => String(e.id) === id);
    if (found) setEventData(found);
  }, [events, id]);

  return (
    <section className="bg-gradient-to-b from-brand-blue via-brand-blue to-brand-bluegrey/10 pt-16 pb-12 min-h-screen">
      <div className="mx-auto max-w-3xl px-4">
        <div className="bg-white rounded-lg border border-brand-light shadow-md">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-brand-blue">Edit Event</h1>
            {eventData ? (
              <EditEventForm event={eventData} />
            ) : (
              <p className="text-brand-bluegrey text-center">Loading event details...</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditEventPage;