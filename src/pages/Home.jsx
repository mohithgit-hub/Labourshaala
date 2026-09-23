import { useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";

/* Job list */
const jobs = [
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

/* Gradient styles for each job */
const jobStyles = {
  Plumber: "from-blue-500 to-blue-700",
  Electrician: "from-yellow-500 to-orange-500",
  Carpenter: "from-amber-600 to-amber-800",
  Cleaner: "from-green-500 to-green-700",
  Painter: "from-pink-500 to-rose-600",
  Gardener: "from-emerald-500 to-emerald-700",
  Mechanic: "from-gray-600 to-gray-800",
  Driver: "from-indigo-500 to-indigo-700",
  Tutor: "from-purple-500 to-purple-700",
  Photographer: "from-fuchsia-500 to-fuchsia-700",
  "House Cleaner": "from-lime-500 to-lime-700",
  "AC Technician": "from-cyan-500 to-cyan-700",
  "Laptop Repair": "from-slate-500 to-slate-700",
  "TV Repair": "from-red-500 to-red-700",
  "Water Purifier Service": "from-sky-500 to-sky-700",
  "Pest Control": "from-orange-600 to-orange-800",
  "Home Nurse": "from-teal-500 to-teal-700",
  Cook: "from-rose-500 to-rose-700",
  "Security Guard": "from-zinc-700 to-zinc-900",
};

export default function Home() {
  const navigate = useNavigate();
  const { searchTerm } = useSearch();

  const filteredJobs = jobs.filter(job =>
    job.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* JOB CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredJobs.map(job => (
          <div
            key={job}
            onClick={() =>
              navigate("/workers", {
                state: { job },
              })
            }
            className={`
              h-28 rounded-2xl p-4 cursor-pointer
              bg-gradient-to-br ${jobStyles[job] || "from-orange-500 to-orange-700"}
              text-white shadow-lg
              flex items-end
              transition-all duration-200 ease-out
              hover:scale-[1.04] hover:shadow-xl
              active:scale-[0.97]
            `}
          >
            <h2 className="text-lg font-semibold leading-tight drop-shadow-sm">
              {job}
            </h2>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <p className="text-gray-500 text-center mt-6">
          No services found
        </p>
      )}
    </div>
  );
}
