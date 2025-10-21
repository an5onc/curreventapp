import React, { useMemo, useState } from "react";
import { useEvents } from "../context/EventsContext";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO date string
  location?: string;
  category?: string;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const { events } = useEvents();
  const { user } = useAuth();
  const rsvpedEvents = (events ?? []).filter((evt: any) => evt.userRsvped);
  const [viewDate, setViewDate] = useState<Date>(startOfMonth(new Date()));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    rsvpedEvents.forEach((evt: any) => {
      const dateStr: string | undefined =
        (typeof evt.date === "string" && evt.date) ||
        (typeof evt.startDate === "string" && evt.startDate) ||
        (typeof evt.startsAt === "string" && evt.startsAt) ||
        (typeof evt.datetime === "string" && evt.datetime) ||
        (typeof evt.start === "string" && evt.start) ||
        undefined;

      if (!dateStr) return;
      const key = dateStr.slice(0, 10);
      const entry: CalendarEvent = {
        id: String(evt.id ?? key + "-" + (evt.title ?? "evt")),
        title: evt.title ?? evt.name ?? "Untitled",
        date: key,
        location: evt.location,
        category: evt.category,
      };
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    });
    return map;
  }, [rsvpedEvents]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const today = new Date();

  const cells: Date[] = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      const d = new Date(monthStart);
      d.setDate(d.getDate() - (firstWeekday - i));
      arr.push(d);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      arr.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
    }
    while (arr.length % 7 !== 0) {
      const last = arr[arr.length - 1];
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      arr.push(next);
    }
    return arr;
  }, [firstWeekday, daysInMonth, monthStart]);

  const monthLabel = viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const normalizedEvents: CalendarEvent[] = useMemo(() => {
    return rsvpedEvents
      .map((evt: any) => {
        const dateStr: string | undefined =
          (typeof evt.date === "string" && evt.date) ||
          (typeof evt.startDate === "string" && evt.startDate) ||
          (typeof evt.startsAt === "string" && evt.startsAt) ||
          (typeof evt.datetime === "string" && evt.datetime) ||
          (typeof evt.start === "string" && evt.start) ||
          undefined;
        if (!dateStr) return undefined;
        const key = dateStr.slice(0, 10);
        return {
          id: String(evt.id ?? key + "-" + (evt.title ?? "evt")),
          title: evt.title ?? evt.name ?? "Untitled",
          date: key,
          location: evt.location,
          category: evt.category,
        } as CalendarEvent;
      })
      .filter(Boolean) as CalendarEvent[];
  }, [rsvpedEvents]);

  const upcomingEvents = normalizedEvents.filter((evt) => new Date(evt.date) >= today);
  const pastEvents = normalizedEvents.filter((evt) => new Date(evt.date) < today);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#001F3D]">{monthLabel}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate(addMonths(viewDate, -1))}
            className="rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 text-slate-800"
          >
            Previous
          </button>
          <button
            onClick={() => setViewDate(startOfMonth(new Date()))}
            className="rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 text-slate-800"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 text-slate-800"
          >
            Next
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border border-slate-200 bg-slate-200">
        {weekDays.map((wd) => (
          <div key={wd} className="bg-white px-2 py-2 text-center text-xs font-medium uppercase text-slate-600">
            {wd}
          </div>
        ))}
        {cells.map((date, idx) => {
          const inMonth = date.getMonth() === viewDate.getMonth();
          const key = toISODate(date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = isSameDay(date, today);

          return (
            <div
              key={idx}
              className={`min-h-[110px] bg-white p-2 align-top ${
                inMonth ? "" : "bg-slate-50 text-slate-600"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-xs ${inMonth ? "text-slate-700" : "text-slate-600"}`}>
                  {date.getDate()}
                </span>
                {isToday && (
                  <span className="rounded bg-[#ffcc00] px-1.5 py-0.5 text-[10px] font-semibold text-black">
                    Today
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((evt) => (
                  <Link
                    key={evt.id}
                    to={`/events/${evt.id}`}
                    className="truncate rounded border border-[#ffcc00]/50 bg-[#ffcc00]/10 px-1.5 py-1 text-xs text-[#001F3D] font-semibold hover:underline hover:text-[#000000]"
                    title={evt.title}
                  >
                    {evt.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-slate-600">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Events */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow">
        <h2 className="mb-2 text-lg font-semibold text-[#001F3D]">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-slate-700">No upcoming events.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {upcomingEvents.map((evt: any) => (
              <li key={evt.id} className="py-2">
                <Link
                  to={`/events/${evt.id}`}
                  className="block text-slate-800 hover:text-slate-900 underline decoration-gray-400"
                >
                  <div className="font-medium">{evt.title}</div>
                  <div className="text-sm text-slate-600">{evt.date}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Past Events */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-100 p-4 shadow">
        <h2 className="mb-2 text-lg font-semibold text-slate-700">Past Events</h2>
        {pastEvents.length === 0 ? (
          <p className="text-slate-700">No past events.</p>
        ) : (
          <ul className="divide-y divide-slate-300">
            {pastEvents.map((evt: any) => (
              <li key={evt.id} className="py-2 opacity-90">
                <Link
                  to={`/events/${evt.id}`}
                  className="block text-slate-800 hover:text-slate-900 underline decoration-gray-400"
                >
                  <div className="font-medium">{evt.title}</div>
                  <div className="text-sm text-slate-600">{evt.date}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
