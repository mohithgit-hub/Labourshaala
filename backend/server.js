import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  getUserByEmail,
  getUserByPhone,
  getUserById,
  createUser,
  addOrUpdateWorkerProfile,
  getAllWorkers,
  getWorkerById,
  createBooking,
  getCustomerBookings,
  getWorkerBookings,
  getBookingById,
  updateBookingStatus,
  makeBookingPayment,
  addBookingReview,
} from "./db.js";
import {
  verifyPassword,
  generateToken,
  requireAuth,
  optionalAuth,
} from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "LabourShaala API",
    time: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// Authentication Routes
// ----------------------------------------------------

/**
 * Register a new user
 * Supports: Worker only, Customer only, or Both
 */
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, phone, password, roleType, workerData, customerData } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Full name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email address is required" });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }

    // Check if email is already registered
    const existingUser = getUserByEmail(email.trim());
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    if (phone) {
      const existingPhone = getUserByPhone(phone.trim());
      if (existingPhone) {
        return res.status(400).json({ error: "An account with this phone number already exists" });
      }
    }

    // Determine roles based on provided sections
    const hasWorker = Boolean(
      roleType === "worker" ||
      roleType === "both" ||
      (workerData && (workerData.skills?.length > 0 || workerData.skill))
    );

    const hasCustomer = Boolean(
      roleType === "customer" ||
      roleType === "both" ||
      customerData?.address ||
      !hasWorker // Default to customer if nothing else
    );

    if (!hasWorker && !hasCustomer) {
      return res.status(400).json({
        error: "Please complete either Worker details or Customer details (or both)",
      });
    }

    let roles = "customer";
    if (hasWorker && hasCustomer) {
      roles = "worker,customer";
    } else if (hasWorker) {
      roles = "worker";
    }

    const created = createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password: password,
      roles,
      workerData: hasWorker ? workerData : null,
      customerData: hasCustomer ? customerData : null,
    });

    const token = generateToken(created);

    // Don't return password in response
    const { password: _, ...safeUser } = created;

    res.status(201).json({
      message: "Account created successfully",
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message || "Failed to register user" });
  }
});

/**
 * Login user via email or phone
 */
app.post("/api/auth/login", (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: "Email/Phone and password are required" });
    }

    const trimmedIdentifier = emailOrPhone.trim();
    let user = getUserByEmail(trimmedIdentifier);
    if (!user) {
      user = getUserByPhone(trimmedIdentifier);
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email/phone or password" });
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email/phone or password" });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.json({
      message: "Login successful",
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

/**
 * Get current authenticated user profile
 */
app.get("/api/auth/me", requireAuth, (req, res) => {
  try {
    const user = getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

/**
 * Add or update Worker Profile for current user
 */
app.post("/api/auth/become-worker", requireAuth, (req, res) => {
  try {
    const { skills, wage, experience, location, bio } = req.body;
    if (!skills || !skills.length) {
      return res.status(400).json({ error: "Please select at least one skill" });
    }

    const updated = addOrUpdateWorkerProfile(req.user.id, {
      skills,
      wage: Number(wage) || 500,
      experience: Number(experience) || 1,
      location: location || "Nearby",
      bio: bio || "Skilled daily wage professional",
    });

    const token = generateToken(updated);
    const { password: _, ...safeUser } = updated;

    res.json({
      message: "Worker profile updated successfully",
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("Become worker error:", err);
    res.status(500).json({ error: err.message || "Failed to update worker profile" });
  }
});

// ----------------------------------------------------
// Worker Directory Routes
// ----------------------------------------------------

/**
 * Get list of workers (filter by skill or search term)
 */
app.get("/api/workers", optionalAuth, (req, res) => {
  try {
    const { skill, search } = req.query;
    const workers = getAllWorkers({ skill, search });
    res.json(workers);
  } catch (err) {
    console.error("Get workers error:", err);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
});

/**
 * Get single worker details by ID
 */
app.get("/api/workers/:id", (req, res) => {
  try {
    const worker = getWorkerById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }
    res.json(worker);
  } catch (err) {
    console.error("Get worker details error:", err);
    res.status(500).json({ error: "Failed to fetch worker details" });
  }
});

// ----------------------------------------------------
// Booking Routes
// ----------------------------------------------------

/**
 * Create a new booking
 */
app.post("/api/bookings", requireAuth, (req, res) => {
  try {
    const { workerId, skillName } = req.body;
    if (!workerId) {
      return res.status(400).json({ error: "workerId is required" });
    }

    const customerId = req.user.id;
    const booking = createBooking({ customerId, workerId, skillName });

    res.status(201).json({
      message: "Booking request placed successfully",
      booking,
    });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: err.message || "Failed to create booking" });
  }
});

/**
 * Get current customer's bookings
 */
app.get("/api/bookings/customer", requireAuth, (req, res) => {
  try {
    const bookings = getCustomerBookings(req.user.id);
    res.json(bookings);
  } catch (err) {
    console.error("Get customer bookings error:", err);
    res.status(500).json({ error: "Failed to fetch customer bookings" });
  }
});

/**
 * Get current worker's bookings
 */
app.get("/api/bookings/worker", requireAuth, (req, res) => {
  try {
    const user = getUserById(req.user.id);
    if (!user || !user.workerProfile) {
      return res.json([]);
    }

    const bookings = getWorkerBookings(user.workerProfile.id);
    res.json(bookings);
  } catch (err) {
    console.error("Get worker bookings error:", err);
    res.status(500).json({ error: "Failed to fetch worker bookings" });
  }
});

/**
 * Update booking status (e.g., Accept, Decline, Work Finished)
 */
app.patch("/api/bookings/:id/status", requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = ["Pending", "Ongoing", "Payment Pending", "Completed", "Declined"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const updated = updateBookingStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      message: `Booking status updated to ${status}`,
      booking: updated,
    });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ error: err.message || "Failed to update booking status" });
  }
});

/**
 * Process booking payment
 */
app.post("/api/bookings/:id/pay", requireAuth, (req, res) => {
  try {
    const { paymentMethod } = req.body; // "UPI" or "Cash"
    const { id } = req.params;

    const method = paymentMethod || "UPI";
    const updated = makeBookingPayment(id, method);
    if (!updated) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      message: `Payment completed via ${method}`,
      booking: updated,
    });
  } catch (err) {
    console.error("Booking payment error:", err);
    res.status(500).json({ error: err.message || "Failed to process payment" });
  }
});

/**
 * Add a rating and review to a completed booking
 */
app.post("/api/bookings/:id/review", requireAuth, (req, res) => {
  try {
    const { rating, review } = req.body;
    const { id } = req.params;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const updated = addBookingReview(id, Number(rating), review || "");
    res.json({
      message: "Review submitted successfully",
      booking: updated,
    });
  } catch (err) {
    console.error("Booking review error:", err);
    res.status(500).json({ error: err.message || "Failed to submit review" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(` LabourShaala Server running on port ${PORT}`);
  console.log(` API URL: http://localhost:${PORT}/api`);
  console.log(`===========================================`);
});
