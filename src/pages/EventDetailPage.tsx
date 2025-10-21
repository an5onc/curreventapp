import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
function linkify(text: string): React.ReactNode[] {
  return text.split(URL_PATTERN).map((part, i) =>
    part.startsWith('http://') || part.startsWith('https://') ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 underline break-all"
      >
        {part}
      </a>
    ) : part
  );
}

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, toggleLike, toggleRsvp, deleteEvent } = useEvents();
  const { user } = useAuth();

  const event = events.find((e) => String(e.id) === String(id));

  const isPriced =
    (event as any)?.isPriced ??
    ((event as any)?.price !== undefined && (event as any)?.price !== null && Number((event as any)?.price) > 0);

  if (!event) return <p className="text-center mt-8">Event not found.</p>;

  // Permission logic
  const isCreator = user && Number(user.id) === Number(event.creatorID);
  const isAppAdmin = user?.email === 'appadmin@unco.edu';
  const canEditOrDelete = isCreator || isAppAdmin;

  const handleDelete = async () => {
    if (!canEditOrDelete) return;
    if (!confirm('Are you sure you want to delete this event?')) return;
    await deleteEvent(event.id);
    navigate('/home'); // redirect to home after deletion
  };

  const handleLike = async () => await toggleLike(event.id);
  const handleRsvp = async () => await toggleRsvp(event.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {event.imageUrl ? (
        <div className="relative mb-6">
          <img
            src={event.imageUrl}
            alt={event.title || 'Event image'}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className="w-full h-64 object-cover rounded-lg shadow bg-gray-200"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6 rounded-lg">
            <h1 className="text-3xl font-bold text-white">{event.title}</h1>
            <p className="text-sm text-gray-200">
              {new Date(event.startDate).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })} • {event.location}
            </p>
          </div>
        </div>
      ) : (
        <div
          className="bg-white p-6 rounded-lg mb-6 flex flex-col justify-center items-center"
          style={{ minHeight: '16rem' }}
        >
          <h1 className="text-3xl font-bold text-black">{event.title}</h1>
          <p className="text-sm mt-2 text-gray-700">
            {new Date(event.startDate).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })} • {event.location}
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h1 className="text-3xl font-bold text-brand-bluegrey">{event.title}</h1>
        <p className="whitespace-pre-line text-brand-bluegrey">{linkify(event.description)}</p>
        <p>
          <strong className="text-brand-gold">Categories:</strong>{' '}
          {Array.isArray(event.categories) ? event.categories.join(', ') : event.category}
        </p>
        {isPriced && (
          <p>
            <strong className="text-brand-gold">Price:</strong> ${Number(event.price).toFixed(2)}
          </p>
        )}
        <p>
          <strong className="text-brand-gold">RSVP:</strong> {event.rsvpRequired ? 'Required' : 'Not Required'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={handleLike}
          className={`px-3 py-1 rounded-full border flex items-center transition-colors ${
            event.userLiked
              ? 'bg-red-100 text-red-600 border-red-200'
              : 'bg-white text-brand-bluegrey hover:bg-brand-light border-brand-light'
          }`}
        >
          ❤️ {event.likes}
        </button>
        <button
          onClick={handleRsvp}
          className={`px-3 py-1 rounded-full border flex items-center transition-colors ${
            event.userRsvped
              ? 'bg-green-100 text-green-600 border-green-200'
              : 'bg-white text-brand-bluegrey hover:bg-brand-light border-brand-light'
          }`}
        >
          🎟️ {event.rsvps}
        </button>
      </div>

      <div className="text-sm text-brand-bluegrey mt-2">
        {event.userLiked && <p>You liked this event.</p>}
        {event.userRsvped && <p>You RSVPed to this event.</p>}
      </div>

      {canEditOrDelete && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => navigate(`/events/${event.id}/edit`)}
            className="px-3 py-1 rounded-full border bg-green-100 text-green-600 border-green-200 hover:bg-brand-gold"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 rounded-full border bg-red-100 text-red-600 hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
