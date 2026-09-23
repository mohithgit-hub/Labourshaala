import {
  Menu,
  ArrowLeft,
  X,
  Search,
  User,
  Briefcase,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useSearch } from "../context/SearchContext";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { searchTerm, setSearchTerm } = useSearch();
  const { currentUser, isWorker, isCustomer, logout } = useAuth();

  // Role display label
  const roleLabel = isWorker && isCustomer
    ? "Worker & Customer"
    : isWorker
    ? "Worker"
    : "Customer";

  return (
    <>
      {/* HEADER BAR */}
      <header className="flex items-center justify-between p-4 bg-white shadow sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {location.pathname !== "/" && (
            <ArrowLeft
              className="cursor-pointer text-gray-700 hover:text-orange-600 transition"
              onClick={() => navigate(-1)}
            />
          )}

          <Menu
            className="cursor-pointer text-gray-700 hover:text-orange-600 transition"
            onClick={() => setMenuOpen(true)}
          />

          <div>
            <h1
              className="text-xl font-bold text-orange-600 cursor-pointer"
              onClick={() => navigate("/")}
            >
              LabourShaala
            </h1>
            {currentUser && (
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-gray-500 font-medium">
                  {currentUser.name}
                </p>
                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded font-semibold">
                  {roleLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-4">
          {location.pathname === "/" && (
            <Search
              className="cursor-pointer text-gray-700 hover:text-orange-600 transition"
              onClick={() => setSearchOpen(prev => !prev)}
            />
          )}

          <button
            onClick={() => navigate("/my-works")}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition"
          >
            My Works
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      {searchOpen && location.pathname === "/" && (
        <div className="bg-white border-b p-3 flex items-center gap-2 animate-fade-in shadow-inner">
          <input
            type="text"
            placeholder="Search services (plumber, cleaner, electrician...)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 p-2 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400"
            autoFocus
          />
          <X
            className="cursor-pointer text-gray-500 hover:text-gray-800"
            onClick={() => {
              setSearchTerm("");
              setSearchOpen(false);
            }}
          />
        </div>
      )}

      {/* SIDE MENU */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          {/* MENU PANEL */}
          <div className="relative bg-white w-72 h-full shadow-xl animate-fade-in flex flex-col justify-between">
            <div>
              {/* PROFILE SECTION */}
              <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                  <p className="font-bold text-gray-900">{currentUser?.name || "User"}</p>
                  <p className="text-xs text-orange-600 font-medium mt-0.5">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-semibold">
                    {roleLabel}
                  </span>
                </div>
                <X
                  className="cursor-pointer text-gray-500 hover:text-gray-800"
                  onClick={() => setMenuOpen(false)}
                />
              </div>

              {/* MENU ITEMS */}
              <div className="p-4 space-y-2">
                <MenuItem
                  icon={<User size={18} />}
                  label="Customer Page (Hire Workers)"
                  onClick={() => {
                    navigate("/");
                    setMenuOpen(false);
                  }}
                />

                <MenuItem
                  icon={<Briefcase size={18} />}
                  label="Worker Dashboard (Jobs)"
                  onClick={() => {
                    navigate("/worker-dashboard");
                    setMenuOpen(false);
                  }}
                />

                <MenuItem
                  icon={<Sparkles size={18} />}
                  label="My Bookings & Works"
                  onClick={() => {
                    navigate("/my-works");
                    setMenuOpen(false);
                  }}
                />
              </div>
            </div>

            {/* LOGOUT BUTTON */}
            <div className="p-4 border-t border-gray-100">
              <MenuItem
                icon={<LogOut size={18} />}
                label="Log Out"
                danger
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- MENU ITEM ---------- */

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3
        px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all
        ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}
