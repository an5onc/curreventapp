// src/components/Navbar.tsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bear from "../assets/images/bear.png";
import EventsIcon from "../assets/images/EventsIcon.png";
import CalendarIcon from "../assets/images/CalendarIcon.png";
import CreateIcon from "../assets/images/CreateIcon.png";
import HelpIcon from "../assets/images/HelpIcon.png";
import ManageIcon from "../assets/images/ManageIcon.png";

export function Navbar() {
  const { user, logout } = useAuth();
  const linkBase =
    "flex items-center gap-1 px-3 py-2 text-white/90 hover:text-[#ffcc00] hover:bg-white/10 rounded-lg";
  const linkActive = "bg-[#ffcc00] text-[#002855] rounded-lg";

  return (
    <nav className="flex justify-between items-center px-6 py-3 bg-[#002855] text-white shadow-md border-b-2 border-[#ffcc00]">
      {/* Left: Logo */}
      <div className="flex items-center">
        <NavLink to={user ? "/home" : "/"} className="flex items-center">
          <img src={bear} alt="Logo" className="h-10" />
        </NavLink>
      </div>

      {/* Right: Navigation Links */}
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <NavLink to="/home" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
              <img src={EventsIcon} alt="Events" className="h-4" />
              <span>Events</span>
            </NavLink>

            <NavLink to="/calendar" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
              <img src={CalendarIcon} alt="Calendar" className="h-4" />
              <span>Calendar</span>
            </NavLink>

            <NavLink to="/create" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
              <img src={CreateIcon} alt="Create" className="h-4" />
              <span>Create</span>
            </NavLink>

            <NavLink to="/help" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
              <img src={HelpIcon} alt="Help" className="h-4" />
              <span>Help</span>
            </NavLink>

            <NavLink to="/profile" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
              <img src={ManageIcon} alt="Profile" className="h-4" />
              <span>Profile</span>
            </NavLink>

            <button
              onClick={logout}
              className="ml-2 text-sm bg-[#ffcc00] text-[#002855] px-3 py-1 rounded-lg font-semibold hover:bg-white"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
              <span>Log In</span>
            </NavLink>

            <NavLink to="/manage" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
              <span>Sign Up</span>
            </NavLink>

            {/* Added Help Link for logged-out users */}
            <NavLink to="/help" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
              <img src={HelpIcon} alt="Help" className="h-4" />
              <span>Help</span>
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
