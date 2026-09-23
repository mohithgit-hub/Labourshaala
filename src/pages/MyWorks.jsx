import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { RefreshCw, Phone, MapPin, Star } from "lucide-react";

export default function MyWorks() {
  const { customerBookings, finishBooking, makePayment, addReview, refreshAll, isLoading } = useBooking();
  const { currentUser } = useAuth();
  const [actionLoading, setActionLoading] = useState(null);

  const pending = customerBookings.filter(b => b.status === "Pending");
  const ongoing = customerBookings.filter(b => b.status === "Ongoing");
  const paymentPending = customerBookings.filter(b => b.status === "Payment Pending");
  const completed = customerBookings.filter(b => b.status === "Completed");

  async function handleFinish(id) {
    try {
      setActionLoading(id);
      await finishBooking(id);
    } catch (err) {
      alert(err.message || "Failed to mark work finished");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePayment(id, method) {
    try {
      setActionLoading(id);
      await makePayment(id, method);
    } catch (err) {
      alert(err.message || "Failed to process payment");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReview(id, rating, review) {
    try {
      setActionLoading(id);
      await addReview(id, rating, review);
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl text-gray-900">My Works</h2>
        <button
          onClick={() => refreshAll()}
          disabled={isLoading}
          className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-semibold p-1.5 rounded-lg bg-orange-50 transition"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* PENDING SECTION */}
      <Section
        title="Pending"
        emptyIcon="📭"
        emptyText="No pending requests"
        emptySub="Book a worker to get started"
      >
        {pending.map(job => (
          <Card key={job.id}>
            <Header job={job} />
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p className="text-sm font-semibold text-orange-600">Wage: ₹{job.worker?.wage}/day</p>
              {job.worker?.phone && (
                <p className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> Contact: {job.worker.phone}</p>
              )}
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 font-medium">
              ⏳ Waiting for worker acceptance
            </p>
          </Card>
        ))}
      </Section>

      {/* ONGOING SECTION */}
      <Section
        title="Ongoing"
        emptyIcon="🛠️"
        emptyText="No ongoing work"
        emptySub="Your active jobs will appear here"
      >
        {ongoing.map(job => (
          <Card key={job.id}>
            <Header job={job} />
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p className="text-sm font-semibold text-orange-600">Wage: ₹{job.worker?.wage}/day</p>
              {job.worker?.phone && (
                <p className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> Worker Phone: {job.worker.phone}</p>
              )}
            </div>

            <button
              onClick={() => handleFinish(job.id)}
              disabled={actionLoading === job.id}
              className="
                mt-3 w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm
                transition-all duration-200
                hover:bg-green-700 shadow-sm
                active:scale-[0.96] disabled:opacity-50
              "
            >
              {actionLoading === job.id ? "Updating..." : "Work Finished"}
            </button>
          </Card>
        ))}
      </Section>

      {/* PAYMENT PENDING SECTION */}
      <Section
        title="Payment Pending"
        emptyIcon="💳"
        emptyText="No pending payments"
        emptySub="Completed jobs will request payment here"
      >
        {paymentPending.map(job => (
          <Card key={job.id}>
            <Header job={job} />
            <p className="text-sm font-bold text-gray-800 mt-2">
              Amount Due: <span className="text-orange-600">₹{job.worker?.wage}</span>
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handlePayment(job.id, "UPI")}
                disabled={actionLoading === job.id}
                className="
                  flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm
                  transition-all duration-200
                  hover:bg-orange-700 shadow-sm
                  active:scale-[0.96] disabled:opacity-50
                "
              >
                Pay via UPI
              </button>
              <button
                onClick={() => handlePayment(job.id, "Cash")}
                disabled={actionLoading === job.id}
                className="
                  flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg font-bold text-sm
                  transition-all duration-200
                  hover:bg-gray-800 shadow-sm
                  active:scale-[0.96] disabled:opacity-50
                "
              >
                Pay with Cash
              </button>
            </div>
          </Card>
        ))}
      </Section>

      {/* COMPLETED SECTION */}
      <Section
        title="Completed"
        emptyIcon="✅"
        emptyText="No completed jobs yet"
        emptySub="Finished jobs will be listed here"
      >
        {completed.map(job => (
          <Card key={job.id}>
            <Header job={job} />
            <p className="text-xs text-gray-600 mt-2">
              Paid via <strong>{job.paymentMethod || "UPI"}</strong> (₹{job.worker?.wage})
            </p>

            {job.rating ? (
              <div className="mt-2.5 p-2.5 bg-green-50/80 border border-green-200 rounded-lg">
                <p className="text-xs font-bold text-green-800 flex items-center gap-1">
                  ⭐ {job.rating}/5 — Your Review
                </p>
                {job.review && (
                  <p className="text-xs text-gray-700 mt-1 italic">
                    "{job.review}"
                  </p>
                )}
              </div>
            ) : (
              <RatingForm
                isLoading={actionLoading === job.id}
                onSubmit={(rating, review) =>
                  handleReview(job.id, rating, review)
                }
              />
            )}
          </Card>
        ))}
      </Section>
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function Header({ job }) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <p className="font-bold text-gray-900">
          {job.worker?.name || "Worker"}
        </p>
        <p className="text-xs font-medium text-orange-600">
          {job.worker?.skill || "Service"}
        </p>
      </div>
      <StatusBadge status={job.status} />
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Ongoing: "bg-blue-100 text-blue-800 border-blue-200",
    "Payment Pending": "bg-orange-100 text-orange-800 border-orange-200",
    Completed: "bg-green-100 text-green-800 border-green-200",
    Declined: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${styles[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

function RatingForm({ onSubmit, isLoading }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  return (
    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
      <p className="text-xs font-bold text-gray-700">Rate this service:</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`
              w-8 h-8 rounded-lg font-bold text-sm transition-all
              ${
                rating === n
                  ? "bg-orange-600 text-white shadow-sm scale-105"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            {n}★
          </button>
        ))}
      </div>

      <input
        value={review}
        onChange={e => setReview(e.target.value)}
        placeholder="Write a review (e.g. fast, neat work)"
        className="w-full bg-white border border-gray-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-orange-400 outline-none"
      />

      <button
        onClick={() => onSubmit(rating, review)}
        disabled={isLoading}
        className="
          w-full bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold
          transition-all duration-200
          hover:bg-green-700 shadow-sm
          active:scale-[0.96] disabled:opacity-50
        "
      >
        {isLoading ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}

function Section({ title, emptyIcon, emptyText, emptySub, children }) {
  return (
    <div>
      <h3 className="font-bold text-lg text-gray-800 mb-2.5">{title}</h3>
      {!children || children.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 text-center shadow-xs animate-fade-in">
          <div className="text-3xl">{emptyIcon}</div>
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
