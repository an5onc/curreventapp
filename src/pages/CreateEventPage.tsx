import React from 'react';
import { useLocation } from 'react-router-dom';
import CreateEventForm from '../components/CreateEventForm';
import EventCreatedPage from './EventsCreatedPage';

/**
 * Page containing the form to create a new event.  The form
 * component encapsulates all of the state required for event
 * creation; this page simply provides a heading and container
 * structure around it.
 */
const CreateEventPage: React.FC = () => {
  const location = useLocation();
  const isSuccess = location.pathname === '/event-created';

  return (
    <section className="bg-gradient-to-b from-brand-blue via-brand-blue to-brand-bluegrey/10 pt-16 pb-12 min-h-screen">
      <div className="mx-auto max-w-3xl px-4">
        <div className="bg-white rounded-lg border border-brand-light shadow-md">
          <div className="p-6">
            {isSuccess ? (
              <EventCreatedPage />
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-4 text-brand-blue">Create New Event</h1>
                <CreateEventForm />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateEventPage;