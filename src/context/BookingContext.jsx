import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { bookingsAPI } from "../api";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const { currentUser, token, isWorker } = useAuth();
  const [customerBookings, setCustomerBookings] = useState([]);
  const [workerBookings, setWorkerBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch customer bookings
  const fetchCustomerBookings = useCallback(async () => {
    if (!token) {
      setCustomerBookings([]);
      return;
    }
    try {
      const data = await bookingsAPI.getCustomerBookings();
      setCustomerBookings(data || []);
    } catch (err) {
      console.error("Error fetching customer bookings:", err.message);
    }
  }, [token]);

  // Fetch worker bookings
  const fetchWorkerBookings = useCallback(async () => {
    if (!token || !isWorker) {
      setWorkerBookings([]);
      return;
    }
    try {
      const data = await bookingsAPI.getWorkerBookings();
      setWorkerBookings(data || []);
    } catch (err) {
      console.error("Error fetching worker bookings:", err.message);
    }
  }, [token, isWorker]);

  // Refresh all bookings for current session
  const refreshAll = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCustomerBookings(),
        isWorker ? fetchWorkerBookings() : Promise.resolve(),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, isWorker, fetchCustomerBookings, fetchWorkerBookings]);

  // Auto-fetch on user login or token change
  useEffect(() => {
    if (token && currentUser) {
      refreshAll();
    } else {
      setCustomerBookings([]);
      setWorkerBookings([]);
    }
  }, [token, currentUser, refreshAll]);

  // CUSTOMER books a worker
  async function bookWorker(worker, skillName) {
    if (!currentUser) {
      throw new Error("You must be logged in to book a worker");
    }

    const workerId = worker.id || worker.profileId || worker.userId;
    const selectedSkill = skillName || worker.skill || (worker.skills && worker.skills[0]);

    try {
      const result = await bookingsAPI.createBooking({
        workerId,
        skillName: selectedSkill,
      });

      // Update local state immediately
      if (result && result.booking) {
        setCustomerBookings(prev => [result.booking, ...prev]);
      }
      return result.booking;
    } catch (err) {
      console.error("Book worker error:", err.message);
      throw err;
    }
  }

  // WORKER accepts a specific booking
  async function acceptBooking(bookingId) {
    try {
      const result = await bookingsAPI.updateStatus(bookingId, "Ongoing");
      setWorkerBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: "Ongoing" } : b))
      );
      setCustomerBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: "Ongoing" } : b))
      );
      return result.booking;
    } catch (err) {
      console.error("Accept booking error:", err.message);
      throw err;
    }
  }

  // WORKER declines a booking
  async function declineBooking(bookingId) {
    try {
      const result = await bookingsAPI.updateStatus(bookingId, "Declined");
      setWorkerBookings(prev => prev.filter(b => b.id !== bookingId));
      setCustomerBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: "Declined" } : b))
      );
      return result.booking;
    } catch (err) {
      console.error("Decline booking error:", err.message);
      throw err;
    }
  }

  // CUSTOMER finishes work (moves to Payment Pending)
  async function finishBooking(bookingId) {
    try {
      const result = await bookingsAPI.updateStatus(bookingId, "Payment Pending");
      setCustomerBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: "Payment Pending" } : b))
      );
      setWorkerBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: "Payment Pending" } : b))
      );
      return result.booking;
    } catch (err) {
      console.error("Finish booking error:", err.message);
      throw err;
    }
  }

  // CUSTOMER makes payment
  async function makePayment(bookingId, method = "UPI") {
    try {
      const result = await bookingsAPI.payBooking(bookingId, method);
      setCustomerBookings(prev =>
        prev.map(b =>
          b.id === bookingId
            ? {
                ...b,
                paymentStatus: "Paid",
                paymentMethod: method,
                status: "Completed",
              }
            : b
        )
      );
      setWorkerBookings(prev =>
        prev.map(b =>
          b.id === bookingId
            ? {
                ...b,
                paymentStatus: "Paid",
                paymentMethod: method,
                status: "Completed",
              }
            : b
        )
      );
      return result.booking;
    } catch (err) {
      console.error("Make payment error:", err.message);
      throw err;
    }
  }

  // CUSTOMER adds rating & review
  async function addReview(bookingId, rating, review) {
    try {
      const result = await bookingsAPI.submitReview(bookingId, rating, review);
      setCustomerBookings(prev =>
        prev.map(b =>
          b.id === bookingId
            ? { ...b, rating: Number(rating), review }
            : b
        )
      );
      setWorkerBookings(prev =>
        prev.map(b =>
          b.id === bookingId
            ? { ...b, rating: Number(rating), review }
            : b
        )
      );
      return result.booking;
    } catch (err) {
      console.error("Add review error:", err.message);
      throw err;
    }
  }

  // Unified list for backward compatibility with existing components
  const bookings = [...customerBookings];

  return (
    <BookingContext.Provider
      value={{
        bookings,
        customerBookings,
        workerBookings,
        isLoading,
        error,
        refreshAll,
        fetchCustomerBookings,
        fetchWorkerBookings,
        bookWorker,
        acceptBooking,
        declineBooking,
        finishBooking,
        makePayment,
        addReview,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used inside BookingProvider");
  }
  return ctx;
}
