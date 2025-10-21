import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import EventPreviewBanner from './EventPreviewBanner';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { API_BASE_URL } from '../api';

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

function EditEventForm({ event }: { event: any }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshEvents } = useEvents();

  const [title, setTitle] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate] = useState(event.startDate ? event.startDate.replace(' ', 'T') : '');
  const [location, setLocation] = useState(event.location || '');
  const [categories, setCategories] = useState<string[]>(event.categories || []);
  const [rsvpRequired, setRsvpRequired] = useState(!!event.rsvpRequired);
  const [imageUrl, setImageUrl] = useState(event.imageUrl || '');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isPriceRequired, setIsPriceRequired] = useState(!!event.isPriced);
  const [price, setPrice] = useState<number | ''>(event.price || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Only one category at a time ---
  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCategories(e.target.checked ? [value] : []);
  };

  // --- Handle image upload ---
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

  // --- Handle submission ---
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

    // --- Trim fields to prevent blank-only input ---
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();

    if (!trimmedTitle || !trimmedDescription || !date || !trimmedLocation) {
      setError('Title Invalid!');
      setIsSubmitting(false);
      return;
    }

    // --- Prevent setting past dates ---
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

    try {
      const fd = new FormData();
      fd.append("updaterID", String(user?.id || 0));
      fd.append("title", trimmedTitle);
      fd.append("description", trimmedDescription);
      fd.append("location", trimmedLocation);
      fd.append("eventType", eventType);
      fd.append("startDateTime", toSql(date));
      fd.append("rsvpRequired", String(rsvpRequired));
      fd.append("isPriced", String(isPriceRequired));
      fd.append("cost", String(isPriceRequired ? price || 0 : 0));
      if (imageBase64) fd.append("image_b64", imageBase64);

      const res = await fetch(`${API_BASE_URL}/events/${event.id}`, {
        method: "PUT",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to update event');

      await refreshEvents();
      navigate(`/events/${event.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update event.');
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

        {/* Price Field */}
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
                  disabled={isSubmitting}
                />
                <label htmlFor={`cat-${cat}`} className="ml-2 text-sm">{cat}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isSubmitting ? 'Updating...' : 'Update Event'}
        </button>
      </form>
    </>
  );
}

export default EditEventForm;
