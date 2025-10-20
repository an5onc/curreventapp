import { useLocation, useNavigate } from 'react-router-dom';

const EventCreatedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventID } = (location.state as { eventID?: number }) || {};

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 pt-16 px-4">
      <div className="bg-white max-w-md w-full p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-indigo-700 mb-4">
          Event Created Successfully!
        </h1>
        <p className="text-gray-600 mb-6">
          Your event has been added to the system.
        </p>

        <div className="flex gap-4 justify-start">
          <button
            onClick={() => navigate(`/events/${eventID}`)}
            disabled={!eventID}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View Event
          </button>
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          >
            Back to Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCreatedPage;