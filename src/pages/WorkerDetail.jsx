import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { workersAPI } from "../api";
import { Star, MapPin, Briefcase, Award, ArrowLeft } from "lucide-react";

export default function WorkerDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { bookWorker } = useBooking();

  const [worker, setWorker] = useState(location.state?.worker || location.state || null);
  const [loading, setLoading] = useState(!worker);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!worker && id) {
      async function fetchWorker() {
        try {
          setLoading(true);
          const data = await workersAPI.getWorkerById(id);
          setWorker(data);
        } catch (err) {
          setError("Failed to load worker details");
        } finally {
          setLoading(false);
        }
      }
      fetchWorker();
    }
  }, [id, worker]);

  // Handle booking action
  async function handleBook() {
    if (!worker) return;
    try {
      setBookingLoading(true);
      setError(null);
      await bookWorker(worker);
      navigate("/my-works");
    } catch (err) {
      setError(err.message || "Failed to book worker. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  }

  // Safety: handle refresh / error state
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-6 shadow animate-pulse h-48" />
      </div>
    );
  }

  if (error && !worker) {
    return (
      <div className="p-4">
        <p className="text-red-600 font-semibold mb-3">
          {error}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="p-4">
        <p className="text-red-600 font-semibold">
          Worker details not found. Please go back and select a worker again.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{worker.name}</h2>
            <p className="text-sm font-semibold text-orange-600 mt-0.5">
              {worker.skill || (worker.skills && worker.skills.join(", "))}
            </p>
          </div>

          <span className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
            <Star size={15} className="fill-green-600 stroke-green-600" /> {worker.rating}
            {worker.ratingCount ? ` (${worker.ratingCount})` : ""}
          </span>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-sm">
          <div className="p-3 bg-orange-50/50 rounded-xl">
            <p className="text-xs text-gray-500 font-medium">Daily Wage</p>
            <p className="text-base font-bold text-orange-700 mt-0.5">
              ₹{worker.wage}/day
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 font-medium">Experience</p>
            <p className="text-base font-bold text-gray-800 mt-0.5 flex items-center gap-1">
              <Award size={15} className="text-orange-500" /> {worker.experience || 2}+ Years
            </p>
          </div>
        </div>

        {/* LOCATION & BIO */}
        <div className="space-y-2 text-sm text-gray-700 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin size={15} className="text-orange-500 shrink-0" />
            <span><strong>Location:</strong> {worker.location || "Nearby"}</span>
          </div>

          {worker.bio && (
            <div className="pt-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">About Worker</p>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed bg-gray-50 p-3 rounded-xl">
                {worker.bio}
              </p>
            </div>
          )}

          {/* ALL SKILLS TAGS */}
          {worker.skills && worker.skills.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Specializations</p>
              <div className="flex flex-wrap gap-1.5">
                {worker.skills.map(s => (
                  <span key={s} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
            ● Available for Hire
          </span>
        </div>
      </div>

      {/* BOOK BUTTON */}
      <button
        onClick={handleBook}
        disabled={bookingLoading}
        className="w-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white p-3.5 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {bookingLoading ? "Placing Booking Request..." : `Book ${worker.name} Now`}
      </button>
    </div>
  );
}
