import React from 'react';

export type SortKey = 'soon' | 'new' | 'popular';

export type EventFiltersState = {
  category: string | null;
  query: string;
  startDate?: string;
  endDate?: string;
  location: string;
  sort: SortKey;
  isPriced?: boolean;
  rsvpRequired?: boolean;
};

export type EventFiltersProps = {
  categories: string[];
  value: EventFiltersState;
  onChange: (next: EventFiltersState) => void;
};

const EventFilters: React.FC<EventFiltersProps> = ({ categories, value, onChange }) => {
  const set = <K extends keyof EventFiltersState>(key: K, v: EventFiltersState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded border border-slate-800 px-2 py-1 text-sm text-slate-800"
        value={value.category ?? ''}
        onChange={(e) => set('category', e.target.value || null)}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <input
        type="date"
        className="rounded border border-slate-800 px-2 py-1 text-sm text-slate-800"
        value={value.startDate ?? ''}
        onChange={(e) => set('startDate', e.target.value || undefined)}
      />
      <input
        type="date"
        className="rounded border border-slate-800 px-2 py-1 text-sm text-slate-800"
        value={value.endDate ?? ''}
        onChange={(e) => set('endDate', e.target.value || undefined)}
      />


      <select
        className="rounded border border-slate-800 px-2 py-1 text-sm text-slate-800"
        value={value.isPriced === undefined ? '' : value.isPriced ? '1' : '0'}
        onChange={(e) => set('isPriced', e.target.value === '' ? undefined : e.target.value === '1')}
      >
        <option value="">All Prices</option>
        <option value="1">Priced</option>
        <option value="0">Free</option>
      </select>

      <select
        className="rounded border border-slate-800 px-2 py-1 text-sm text-slate-800"
        value={value.rsvpRequired === undefined ? '' : value.rsvpRequired ? '1' : '0'}
        onChange={(e) => set('rsvpRequired', e.target.value === '' ? undefined : e.target.value === '1')}
      >
        <option value="">All RSVP</option>
        <option value="1">RSVP Required</option>
        <option value="0">No RSVP</option>
      </select>

      <select
        className="rounded border border-slate-800 px-2 py-1 text-sm text-slate-800"
        value={value.sort}
        onChange={(e) => set('sort', e.target.value as SortKey)}
      >
        <option value="soon">Starting Soon</option>
        <option value="new">Newest</option>
        <option value="popular">Most Liked</option>
      </select>
    </div>
  );
};

export default EventFilters;