import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { workersAPI } from "../api";

export default function WorkerList() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedJob = location.state?.job;

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedJob) return;

    async function loadWorkers() {
      try {
        setLoading(true);
        setError(null);
        const data = await workersAPI.getWorkers({ skill: selectedJob });
        setWorkers(data || []);
      } catch (err) {
        console.error("Failed to load workers:", err);
        setError(err.message || "Failed to load workers");
      } finally {
        setLoading(false);
      }
    }

    loadWorkers();
  }, [selectedJob]);

  if (!selectedJob) {
    return (
      <div className="p-4">
        <p className="text-red-600 font-semibold">
          No service selected. Please go back.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          {selectedJob}s Near You
        </h2>
        <span className="text-xs font-semibold text-gray-500 bg-gray-200/70 px-2.5 py-1 rounded-full">
          {workers.length} available
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-2xl p-4 shadow animate-pulse h-28" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-700 text-sm">
          {error}
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-gray-50 border rounded-xl p-6 text-center animate-fade-in">
          <div className="text-3xl">😕</div>
          <p className="font-semibold mt-2 text-gray-800">
            No {selectedJob.toLowerCase()}s registered yet
          </p>
          <p className="text-sm text-gray-500">
            Registered workers with {selectedJob} skills will appear here.
          </p>
        </div>
      ) : (
        workers.map(worker => (
          <div
            key={worker.id}
            onClick={() =>
              navigate(`/worker/${worker.id}`, {
                state: { worker },
              })
            }
            className="
              bg-white rounded-2xl shadow
              p-4 cursor-pointer
              transition-all duration-200 ease-out
              hover:shadow-lg hover:-translate-y-1
              active:scale-[0.97]
            "
          >
            {/* TOP */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {worker.name}
                </h3>
                {worker.location && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-orange-500" /> {worker.location}
                  </p>
                )}
              </div>

              <span className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold transition-colors duration-200">
                <Star size={14} className="fill-green-600 stroke-green-600" /> {worker.rating}
              </span>
            </div>

            {/* SKILL / SKILLS */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                {worker.skill}
              </span>
              {worker.skills?.filter(s => s !== worker.skill).map(s => (
                <span key={s} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  +{s}
                </span>
              ))}
            </div>

            {/* BOTTOM */}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
              <span className="text-orange-600 font-bold">
                ₹{worker.wage}/day
              </span>

              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">
                Available
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
