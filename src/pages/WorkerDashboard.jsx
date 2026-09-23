import { useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/AuthContext";
import { RefreshCw, Phone, Star, Briefcase, Plus, Check, MapPin, Award } from "lucide-react";

const POPULAR_SKILLS = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Cleaner",
  "Painter",
  "Gardener",
  "Mechanic",
  "Driver",
  "Tutor",
  "Photographer",
  "House Cleaner",
  "AC Technician",
  "Laptop Repair",
  "TV Repair",
  "Water Purifier Service",
  "Pest Control",
  "Home Nurse",
  "Cook",
  "Security Guard",
];

export default function WorkerDashboard() {
  const { workerBookings, acceptBooking, declineBooking, refreshAll, isLoading } = useBooking();
  const { currentUser, isWorker, becomeWorker } = useAuth();

  const [actionLoading, setActionLoading] = useState(null);

  // Become Worker Form State (if not already registered as worker)
  const [skills, setSkills] = useState(["Plumber"]);
  const [customSkill, setCustomSkill] = useState("");
  const [wage, setWage] = useState("500");
  const [experience, setExperience] = useState("3");
  const [location, setLocation] = useState("Bangalore");
  const [bio, setBio] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const pendingJobs = workerBookings.filter(b => b.status === "Pending");
  const ongoingJobs = workerBookings.filter(
    b => b.status === "Ongoing" || b.status === "Payment Pending"
  );
  const completedJobs = workerBookings.filter(b => b.status === "Completed");

  async function handleAccept(id) {
    try {
      setActionLoading(id);
      await acceptBooking(id);
    } catch (err) {
      alert(err.message || "Failed to accept booking");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline(id) {
    try {
      setActionLoading(id);
      await declineBooking(id);
    } catch (err) {
      alert(err.message || "Failed to decline booking");
    } finally {
      setActionLoading(null);
    }
  }

  function toggleSkill(skillName) {
    if (skills.includes(skillName)) {
      if (skills.length === 1 && !customSkill) return;
      setSkills(skills.filter(s => s !== skillName));
    } else {
      setSkills([...skills, skillName]);
    }
  }

  function addCustom() {
    if (!customSkill.trim()) return;
    const trimmed = customSkill.trim();
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setCustomSkill("");
  }

  async function handleBecomeWorkerSubmit(e) {
    e.preventDefault();
    if (skills.length === 0) {
      setFormError("Please select at least one skill");
      return;
    }
    try {
      setFormLoading(true);
      setFormError("");
      await becomeWorker({
        skills,
        wage: Number(wage) || 500,
        experience: Number(experience) || 1,
        location: location || "Nearby",
        bio: bio || `Skilled ${skills.join(", ")} professional`,
      });
      await refreshAll();
    } catch (err) {
      setFormError(err.message || "Failed to register as worker");
    } finally {
      setFormLoading(false);
    }
  }

  // IF USER IS NOT REGISTERED AS WORKER YET:
  if (!isWorker) {
    return (
      <div className="p-4 space-y-6 max-w-md mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center space-y-3">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            <Briefcase size={26} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Activate Your Worker Profile
          </h2>
          <p className="text-xs text-gray-600">
            You are currently registered as a Customer. Add your skills and daily wage to receive direct job requests from customers on LabourShaala!
          </p>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleBecomeWorkerSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select Your Skills / Jobs (Multiple allowed):
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-gray-50 rounded-xl border border-gray-200">
              {POPULAR_SKILLS.map(s => {
                const sel = skills.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSkill(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      sel
                        ? "bg-orange-600 text-white border-orange-600 font-semibold"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1.5 mt-2">
              <input
                type="text"
                placeholder="Other skill (e.g. Mason)"
                value={customSkill}
                onChange={e => setCustomSkill(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs outline-none"
              />
              <button
                type="button"
                onClick={addCustom}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Daily Wage (₹/day)
              </label>
              <input
                type="number"
                value={wage}
                onChange={e => setWage(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Location / City
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              About You / Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="e.g. Reliable and skilled plumber with 5 years experience"
              className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition active:scale-[0.98] disabled:opacity-50"
          >
            {formLoading ? "Activating Profile..." : "Register as Worker"}
          </button>
        </form>
      </div>
    );
  }

  // WORKER DASHBOARD VIEW
  const workerProfile = currentUser?.workerProfile;

  return (
    <div className="p-4 space-y-6">
      {/* WORKER PROFILE BANNER */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-gray-900">{currentUser.name}</h2>
            <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
              Verified Worker
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mt-1.5">
            {workerProfile?.skills?.map(s => (
              <span key={s} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded font-medium">
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
            <span className="font-bold text-orange-600">₹{workerProfile?.wage || 500}/day</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 font-bold text-green-700">
              <Star size={13} className="fill-green-600 stroke-green-600" /> {workerProfile?.rating || 5.0} ({workerProfile?.ratingCount || 1})
            </span>
            <span>•</span>
            <span>{workerProfile?.location || "Nearby"}</span>
          </div>
        </div>

        <button
          onClick={() => refreshAll()}
          disabled={isLoading}
          className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-semibold p-2 rounded-lg bg-orange-50 transition self-end sm:self-auto"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh Jobs
        </button>
      </div>

      {/* JOB REQUESTS (PENDING) */}
      <Section
        title="Job Requests"
        icon="🔔"
        emptyText="No job requests"
        emptySub="New booking requests from customers will appear here"
      >
        {pendingJobs.map(job => (
          <Card key={job.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{job.customerName || "Customer"}</p>
                <p className="text-xs text-orange-600 font-semibold">{job.worker?.skill || "Service requested"}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">Wage: ₹{job.worker?.wage}/day</p>
              {job.customerPhone && (
                <p className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> Customer Contact: {job.customerPhone}</p>
              )}
            </div>

            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => handleAccept(job.id)}
                disabled={actionLoading === job.id}
                className="
                  flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-xs
                  transition-all duration-200
                  hover:bg-green-700 shadow-sm
                  active:scale-[0.96] disabled:opacity-50
                "
              >
                {actionLoading === job.id ? "Accepting..." : "Accept Job"}
              </button>
              <button
                onClick={() => handleDecline(job.id)}
                disabled={actionLoading === job.id}
                className="
                  flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-xs
                  transition-all duration-200
                  hover:bg-red-600 shadow-sm
                  active:scale-[0.96] disabled:opacity-50
                "
              >
                {actionLoading === job.id ? "Declining..." : "Decline"}
              </button>
            </div>
          </Card>
        ))}
      </Section>

      {/* ONGOING JOBS */}
      <Section
        title="Ongoing Jobs"
        icon="🛠️"
        emptyText="No ongoing jobs"
        emptySub="Accepted jobs in progress will show here"
      >
        {ongoingJobs.map(job => (
          <Card key={job.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{job.customerName || "Customer"}</p>
                <p className="text-xs text-orange-600 font-semibold">{job.worker?.skill}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">Wage: ₹{job.worker?.wage}</p>
              {job.customerPhone && (
                <p className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> Phone: {job.customerPhone}</p>
              )}
            </div>

            {job.status === "Payment Pending" && (
              <p className="mt-2 text-xs bg-orange-50 text-orange-700 font-medium p-2 rounded-lg">
                💳 Customer is completing payment for this work
              </p>
            )}
          </Card>
        ))}
      </Section>

      {/* COMPLETED JOBS */}
      <Section
        title="Completed Jobs"
        icon="✅"
        emptyText="No completed jobs"
        emptySub="Finished work and client ratings will be listed here"
      >
        {completedJobs.map(job => (
          <Card key={job.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{job.customerName || "Customer"}</p>
                <p className="text-xs text-gray-500">{job.worker?.skill}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <p className="text-xs text-gray-600 mt-1">
              Payment: <strong>₹{job.worker?.wage}</strong> ({job.paymentMethod || "UPI"})
            </p>

            {job.rating && (
              <div className="mt-2 p-2.5 bg-green-50/80 border border-green-200 rounded-lg">
                <p className="text-xs font-bold text-green-800">
                  ⭐ {job.rating}/5 Rating Received
                </p>
                {job.review && (
                  <p className="text-xs text-gray-700 mt-0.5 italic">
                    "{job.review}"
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}
      </Section>
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Ongoing: "bg-blue-100 text-blue-800 border-blue-200",
    "Payment Pending": "bg-orange-100 text-orange-800 border-orange-200",
    Completed: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <span
      className={`
        px-3 py-1 rounded-full text-xs font-bold border
        transition-colors
        ${styles[status] || "bg-gray-100 text-gray-800"}
      `}
    >
      {status}
    </span>
  );
}

function Section({ title, icon, emptyText, emptySub, children }) {
  return (
    <div>
      <h3 className="font-bold text-lg text-gray-800 mb-2.5">{title}</h3>
      {!children || children.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 text-center shadow-xs animate-fade-in">
          <div className="text-3xl">{icon}</div>
          <p className="font-semibold mt-2 text-gray-800">{emptyText}</p>
          <p className="text-xs text-gray-500">{emptySub}</p>
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      className="
        bg-white p-4 rounded-2xl shadow-sm border border-gray-100
        transition-all duration-200
        hover:shadow-md
      "
    >
      {children}
    </div>
  );
}
