import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types/Event';
import { useEvents } from '../context/EventsContext';

interface EventItemProps {
  event: Event;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const { toggleLike, toggleRsvp, events } = useEvents();

  // Always get the most up-to-date event object from context
  const contextEvent = events.find((e) => e.id === event.id) || event;

  const likesCount = contextEvent.likes ?? 0;
  const rsvpsCount = contextEvent.rsvps ?? 0;
  const liked = contextEvent.userLiked ?? false;
  const rsvped = contextEvent.userRsvped ?? false;

  const location = contextEvent.location || 'Location TBD';

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-light p-4 flex flex-col sm:flex-row gap-4">
      {contextEvent.imageUrl && (
        <img
          src={contextEvent.imageUrl}
          alt={contextEvent.title}
          className="w-full sm:w-40 h-32 object-cover rounded-md"
        />
      )}

      <div className="flex-1">
        <Link to={`/events/${contextEvent.id}`}>
          <h2 className="text-xl font-bold text-black hover:text-gray-800 cursor-pointer underline decoration-gray-400 decoration-1">
            {contextEvent.title}
          </h2>
        </Link>

        <div className="text-sm text-brand-bluegrey mb-2 leading-relaxed">
          {contextEvent.startDate && (
            <>
              <p className="font-medium text-brand-bluegrey">
                {new Date(contextEvent.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
              <p className="text-brand-bluegrey">
                {new Date(contextEvent.startDate).toLocaleTimeString(undefined, { timeStyle: 'short' })}
              </p>
            </>
          )}
          <p className="text-brand-bluegrey italic">{location}</p>
        </div>

        <p className="text-sm text-brand-bluegrey mb-2">
          {contextEvent.category && (
            <span>
              <strong>Category:</strong> {contextEvent.category}
            </span>
          )}
          {contextEvent.host && (
            <span className="ml-4">
              <strong>Host:</strong> {contextEvent.host}
            </span>
          )}
        </p>

        <div className="flex flex-wrap gap-2 items-center mt-2">
          <button
            onClick={() => toggleLike(contextEvent.id)}
            className={`px-3 py-1 rounded-full border flex items-center transition-colors ${
              liked
                ? 'bg-red-100 text-red-600 border-red-200'
                : 'bg-white text-brand-bluegrey hover:bg-brand-light border-brand-light'
            }`}
            aria-label={liked ? 'Unlike event' : 'Like event'}
          >
            ❤️ {likesCount}
          </button>

          <button
            onClick={() => toggleRsvp(contextEvent.id)}
            className={`px-3 py-1 rounded-full border flex items-center transition-colors ${
              rsvped
                ? 'bg-green-100 text-green-600 border-green-200'
                : 'bg-white text-brand-bluegrey hover:bg-brand-light border-brand-light'
            }`}
            aria-label={rsvped ? 'Cancel RSVP' : 'RSVP to event'}
          >
            🎟️ {rsvpsCount}
          </button>

          <Link
            to={`/events/${contextEvent.id}`}
            className="mt-4 text-gray-800 hover:text-gray-600 underline decoration-gray-400 decoration-1 font-semibold"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventItem;
