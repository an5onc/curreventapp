import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import EventPreviewBanner from './EventPreviewBanner';
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
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [rsvpRequired, setRsvpRequired] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isPriceRequired, setIsPriceRequired] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🟢 NEW: track submission/loading state

  // --- Ensure only ONE category can be selected ---
  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (e.target.checked) setCategories([v]);
    else setCategories([]);
  };

  // --- Handle image ---
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImageUrl(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  };

  // --- Form submission ---
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;
  setIsSubmitting(true);
  setError(null);

  if (!user?.id) {
    setError('You must be logged in.');
    setIsSubmitting(false);
    return;
  }

  // --- Trim input values to ensure no blank-only inputs ---
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const trimmedLocation = location.trim();

  if (!trimmedTitle || !trimmedDescription || !date || !trimmedLocation) {
    setError('Title invalid!');
    setIsSubmitting(false);
    return;
  }

  // --- Check that the date is not in the past ---
  const selectedDate = new Date(date);
  const now = new Date();

  if (selectedDate.getTime() < now.getTime()) {
    setError('Event date and time cannot be in the past.');
    setIsSubmitting(false);
    return;
  }

  if (categories.length === 0) {
    setError('Select one category.');
    setIsSubmitting(false);
    return;
  }

  const allowed = new Set(AVAILABLE_TYPES);
  const eventType = categories.find(c => allowed.has(c)) || 'Workshops';

  const payload = {
    creatorID: parseInt(user?.id || '0', 10),
    title: trimmedTitle,
    description: trimmedDescription,
    location: trimmedLocation,
    eventType,
    eventAccess: 'Public',
    images: imageBase64,
    startDateTime: toSql(date),
    rsvpRequired,
    isPriced: !!isPriceRequired,
    cost: isPriceRequired ? Number(price || 0) : null,
    categories: []
  };

  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Failed to create event');

    await refreshEvents();
    navigate('/event-created', { state: { eventID: data.eventID } });
  } catch (err: any) {
    setError(err.message || 'Failed to create event.');
  } finally {
    setIsSubmitting(false);
  }
};
  const handlePriceToggle = (checked: boolean) => {
    setIsPriceRequired(checked);
    if (!checked) setPrice('');
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

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Event Title</label>
          <input
            id="title"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            rows={3}
            required
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date and Time</label>
          <input
            type="datetime-local"
            id="date"
            value={date}
            onChange={(e)=>setDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
          <input
            id="location"
            value={location}
            onChange={(e)=>setLocation(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        {/* RSVP */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rsvp"
            checked={rsvpRequired}
            onChange={(e)=>setRsvpRequired(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="rsvp" className="ml-2 text-sm">RSVP Required?</label>
        </div>

        {/* Pricing */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPrice"
            checked={isPriceRequired}
            onChange={(e)=>handlePriceToggle(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="isPrice" className="ml-2 text-sm">Is Price Required?</label>
        </div>

        {/* Price field with $ prefix */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
          <div className="mt-1 flex items-center border rounded-md px-3 py-2 bg-gray-50">
            <span className="text-gray-500 mr-2 select-none">$</span>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e)=>setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="flex-1 bg-transparent focus:outline-none"
              disabled={!isPriceRequired}
              placeholder={isPriceRequired ? 'Enter amount' : 'Price not Selected'}
            />
          </div>
        </div>

        {/* Image */}
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

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-4 p-3 border rounded-md">
            {AVAILABLE_TYPES.map(cat => (
              <div key={cat} className="flex items-center">
                <input
                  type="checkbox"
                  id={`cat-${cat}`}
                  value={cat}
                  checked={categories.includes(cat)}
                  onChange={handleCategoryChange}
                  className="h-4 w-4"
                  disabled={isSubmitting} // optional safeguard
                />
                <label htmlFor={`cat-${cat}`} className="ml-2 text-sm">{cat}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </>
  );
}

export default CreateEventForm;
