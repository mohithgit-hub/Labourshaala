import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Briefcase, User, Check, Plus, X, Shield } from "lucide-react";

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

export default function AuthPage() {
  const { login, register } = useAuth();

  const [tab, setTab] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Role Toggles
  const [enableWorker, setEnableWorker] = useState(true);
  const [enableCustomer, setEnableCustomer] = useState(false);

  // Worker Profile Form
  const [selectedSkills, setSelectedSkills] = useState(["Plumber"]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [workerWage, setWorkerWage] = useState("500");
  const [workerExperience, setWorkerExperience] = useState("3");
  const [workerLocation, setWorkerLocation] = useState("Bangalore");
  const [workerBio, setWorkerBio] = useState("");

  // Customer Profile Form
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerLocation, setCustomerLocation] = useState("Bangalore");

  // Toggle Skill Selection
  function toggleSkill(skill) {
    if (selectedSkills.includes(skill)) {
      if (selectedSkills.length === 1 && !customSkillInput) return;
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  }

  // Add custom skill tag
  function addCustomSkill() {
    if (!customSkillInput.trim()) return;
    const trimmed = customSkillInput.trim();
    if (!selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setCustomSkillInput("");
  }

  // Handle Login Submit
  async function handleLogin(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage("Please enter your email/phone and password.");
      return;
    }

    try {
      setLoading(true);
      await login(loginIdentifier.trim(), loginPassword);
    } catch (err) {
      setErrorMessage(err.message || "Failed to log in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Register Submit
  async function handleRegister(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!regName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }
    if (!enableWorker && !enableCustomer) {
      setErrorMessage("Please select at least one role: Worker, Customer, or Both.");
      return;
    }
    if (enableWorker && selectedSkills.length === 0) {
      setErrorMessage("Please select at least one skill for your worker profile.");
      return;
    }

    const payload = {
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim() || undefined,
      password: regPassword,
      roleType: enableWorker && enableCustomer ? "both" : enableWorker ? "worker" : "customer",
      workerData: enableWorker
        ? {
            skills: selectedSkills,
            wage: Number(workerWage) || 500,
            experience: Number(workerExperience) || 1,
            location: workerLocation || "Nearby",
            bio: workerBio || `Skilled ${selectedSkills.join(", ")} professional`,
          }
        : undefined,
      customerData: enableCustomer
        ? {
            address: customerAddress || "",
            location: customerLocation || "Nearby",
            phone: regPhone.trim() || undefined,
          }
        : undefined,
    };

    try {
      setLoading(true);
      await register(payload);
      setSuccessMessage("Account created successfully!");
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 py-8">
      {/* BRAND HEADER */}
      <div className="text-center mb-6 max-w-md w-full">
        <h1 className="text-3xl font-extrabold text-orange-600 tracking-tight">
          LabourShaala
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Hire Skilled Daily Wage Workers Instantly
        </p>
      </div>

      {/* AUTH CARD */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* TABS */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              setTab("login");
              setErrorMessage("");
            }}
            className={`flex-1 py-3.5 text-sm font-bold text-center transition-all ${
              tab === "login"
                ? "bg-white text-orange-600 border-b-2 border-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setTab("register");
              setErrorMessage("");
            }}
            className={`flex-1 py-3.5 text-sm font-bold text-center transition-all ${
              tab === "register"
                ? "bg-white text-orange-600 border-b-2 border-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* ALERTS */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-fade-in">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium animate-fade-in">
            {successMessage}
          </div>
        )}

        <div className="p-6">
          {/* ===================================== */}
          {/* LOGIN VIEW */}
          {/* ===================================== */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address or Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your registered email or phone"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? "Logging in..." : "Log In to LabourShaala"}
              </button>

              <div className="pt-3 text-center">
                <p className="text-xs text-gray-500">
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("register");
                      setErrorMessage("");
                    }}
                    className="text-orange-600 font-bold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ===================================== */}
          {/* REGISTER VIEW */}
          {/* ===================================== */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* BASIC DETAILS */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 4 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              {/* ROLE SELECTION HEADER */}
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
                  <Shield size={14} className="text-orange-600" />
                  Select Profile Type (Choose Worker, Customer, or Both)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEnableWorker(!enableWorker)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      enableWorker
                        ? "bg-orange-50 border-orange-500 text-orange-700 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={15} /> Worker Profile
                    </span>
                    {enableWorker && <Check size={14} className="text-orange-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnableCustomer(!enableCustomer)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      enableCustomer
                        ? "bg-orange-50 border-orange-500 text-orange-700 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <User size={15} /> Customer Profile
                    </span>
                    {enableCustomer && <Check size={14} className="text-orange-600" />}
                  </button>
                </div>
              </div>

              {/* WORKER SECTION (IF ENABLED) */}
              {enableWorker && (
                <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-800 flex items-center gap-1">
                      <Briefcase size={13} /> Worker Details & Skills
                    </span>
                    <span className="text-[10px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-semibold">
                      {selectedSkills.length} selected
                    </span>
                  </div>

                  {/* SKILLS MULTI-SELECT */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                      Select Your Skills / Jobs (You can select multiple):
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-orange-100">
                      {POPULAR_SKILLS.map(skill => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            type="button"
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                              isSelected
                                ? "bg-orange-600 text-white border-orange-600 font-semibold shadow-xs"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50"
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>

                    {/* CUSTOM SKILL INPUT */}
                    <div className="flex gap-1.5 mt-2">
                      <input
                        type="text"
                        placeholder="Add other skill (e.g. Mason, Welder)"
                        value={customSkillInput}
                        onChange={e => setCustomSkillInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomSkill();
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        onClick={addCustomSkill}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* WAGE, EXPERIENCE & LOCATION */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Daily Wage (₹/day)
                      </label>
                      <input
                        type="number"
                        placeholder="500"
                        value={workerWage}
                        onChange={e => setWorkerWage(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        placeholder="3"
                        value={workerExperience}
                        onChange={e => setWorkerExperience(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Service Area / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Koramangala, Bangalore"
                      value={workerLocation}
                      onChange={e => setWorkerLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Short Bio (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Professional repair with 5+ years experience"
                      value={workerBio}
                      onChange={e => setWorkerBio(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* CUSTOMER SECTION (IF ENABLED) */}
              {enableCustomer && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 animate-fade-in">
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
                    <User size={13} /> Customer Details
                  </span>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Home / Service Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 301, Sunshine Apts, 5th Cross"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      City / Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore"
                      value={customerLocation}
                      onChange={e => setCustomerLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 mt-3"
              >
                {loading ? "Creating Account..." : "Register on LabourShaala"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
