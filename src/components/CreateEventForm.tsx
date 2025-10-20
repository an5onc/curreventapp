import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import EventPreviewBanner from './EventPreviewBanner';
import Popup from './Popup';
import InviteUserSearch from './InviteUserSearch';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { API_BASE_URL } from '../api';

interface User { id: string; name: string; }

const AVAILABLE_TYPES = [
  "Art","Math","Science","Computer Science","History","Education",
  "Political Science","Software Engineering","Business","Sports",
  "Honors","Workshops","Study Session","Dissertation","Performance","Competition"
];

const toSql = (v: string) => {
  if (!v) return '';
  const [d, t] = v.split('T');
  const time = t?.length === 5 ? `${t}:00` : t;
  return `${d} ${time}`;
};

function CreateEventForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshEvents } = useEvents();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');               // datetime-local
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [rsvpRequired, setRsvpRequired] = useState(false);
  const [capacity, setCapacity] = useState('');       // unused by backend
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isPriceRequired, setIsPriceRequired] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<User[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCategories(prev => e.target.checked ? [...prev, v] : prev.filter(x => x !== v));
  };

  const handleInviteUser = (u: User) => {
    setInvitedUsers(prev => prev.some(x => x.id === u.id) ? prev : [...prev, u]);
  };

  const handleTogglePrivate = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsPrivate(checked);
    if (!checked) setInvitedUsers([]);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImageUrl(URL.createObjectURL(file)); // still show preview
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user?.id) { setError('You must be logged in.'); return; }
    if (!title || !description || !date || !location) { setError('Fill all required fields.'); return; }
    if (categories.length === 0) { setError('Select at least one category.'); return; }

    // pick a valid backend type
    const allowed = new Set(AVAILABLE_TYPES);
    const eventType = categories.find(c => allowed.has(c)) || 'Workshops';

    const payload = {
      creatorID: parseInt(user?.id || '0', 10),
      title,
      description,
      location,
      eventType,
      eventAccess: isPrivate ? 'Private' : 'Public',
      images: imageBase64,
      startDateTime: toSql(date),
      rsvpRequired,
      isPriced: !!isPriceRequired,
      cost: isPriceRequired ? Number(price || 0) : null,
      categories: categories.filter(c => allowed.has(c) && c !== eventType),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to create event');
      // Refresh events before redirecting to the event-created success screen
      await refreshEvents();
      navigate('/event-created', { state: { eventID: data.eventID } });
    } catch (err: any) {
      setError(err.message || 'Failed to create event.');
    }
  };

  return (
    <>
      {imageUrl && (
        <EventPreviewBanner
          title={title}
          date={date}
          location={location}
          imageUrl={imageUrl}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        {error && <div className="text-red-500 bg-red-100 p-3 rounded">{error}</div>}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Event Title</label>
          <input id="title" value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" required />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" value={description} onChange={(e)=>setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" rows={3} required />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date and Time</label>
          <input type="datetime-local" id="date" value={date} onChange={(e)=>setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" required />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
          <input id="location" value={location} onChange={(e)=>setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" required />
        </div>

        <div className="flex items-center">
          <input type="checkbox" id="isPrivate" checked={isPrivate} onChange={handleTogglePrivate} className="h-4 w-4" />
          <label htmlFor="isPrivate" className="ml-2 text-sm">Private event?</label>
        </div>

        {isPrivate && (
          <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">Private Event Invitation</h4>
            <button type="button" onClick={() => setIsPopupOpen(true)} className="w-full py-2 px-4 rounded-md text-white bg-green-600 hover:bg-green-700">
              {invitedUsers.length > 0 ? `Manage ${invitedUsers.length} Invited Users` : 'Invite Users'}
            </button>
          </div>
        )}

        <div className="flex items-center">
          <input type="checkbox" id="rsvp" checked={rsvpRequired} onChange={(e)=>setRsvpRequired(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="rsvp" className="ml-2 text-sm">RSVP Required?</label>
        </div>

        <div className="flex items-center">
          <input type="checkbox" id="isPrice" checked={isPriceRequired} onChange={(e)=>setIsPriceRequired(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="isPrice" className="ml-2 text-sm">Is Price Required?</label>
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
          <input id="price" type="number" value={price} onChange={(e)=>setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border rounded-md" />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">Event Image</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
          <div className="flex flex-wrap gap-4 p-3 border rounded-md">
            {AVAILABLE_TYPES.map(cat => (
              <div key={cat} className="flex items-center">
                <input type="checkbox" id={`cat-${cat}`} value={cat} checked={categories.includes(cat)} onChange={handleCategoryChange} className="h-4 w-4" />
                <label htmlFor={`cat-${cat}`} className="ml-2 text-sm">{cat}</label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          Create Event
        </button>
      </form>

      {isPopupOpen && (
        <Popup onClose={() => setIsPopupOpen(false)}>
          <InviteUserSearch onInvite={handleInviteUser} invitedUsers={invitedUsers} />
        </Popup>
      )}
    </>
  );
}

export default CreateEventForm;