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
} from "./prismaDb.js";

import {
  verifyPassword,
  generateToken,
  requireAuth,
  optionalAuth,
} from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "LabourShaala API",
    time: new Date().toISOString(),
  });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      roleType,
      workerData,
      customerData,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Full name is required",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: "Email address is required",
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({
        error: "Password must be at least 4 characters",
      });
    }

    const existingUser = await getUserByEmail(email.trim());

    if (existingUser) {
      return res.status(400).json({
        error: "An account with this email already exists",
      });
    }

    if (phone) {
      const existingPhone = await getUserByPhone(phone.trim());

      if (existingPhone) {
        return res.status(400).json({
          error: "An account with this phone number already exists",
        });
      }
    }

    const hasWorker = Boolean(
      roleType === "worker" ||
        roleType === "both" ||
        (workerData &&
          (workerData.skills?.length > 0 || workerData.skill))
    );

    const hasCustomer = Boolean(
      roleType === "customer" ||
        roleType === "both" ||
        customerData?.address ||
        !hasWorker
    );

    if (!hasWorker && !hasCustomer) {
      return res.status(400).json({
        error:
          "Please complete either Worker details or Customer details (or both)",
      });
    }

    let roles = "customer";

    if (hasWorker && hasCustomer) {
      roles = "worker,customer";
    } else if (hasWorker) {
      roles = "worker";
    }

    const created = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password,
      roles,
      workerData: hasWorker ? workerData : null,
      customerData: hasCustomer ? customerData : null,
    });

    const token = generateToken(created);
    const { password: _, ...safeUser } = created;

    res.status(201).json({
      message: "Account created successfully",
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("Registration error:", err);

    res.status(500).json({
      error: err.message || "Failed to register user",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        error: "Email/Phone and password are required",
      });
    }

    const trimmedIdentifier = emailOrPhone.trim();

    let user = await getUserByEmail(trimmedIdentifier);

    if (!user) {
      user = await getUserByPhone(trimmedIdentifier);
    }

    if (!user) {
      return res.status(401).json({
        error: "Invalid email/phone or password",
      });
    }

    const isValid = verifyPassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid email/phone or password",
      });
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

    res.status(500).json({
      error: "Failed to login",
    });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const { password: _, ...safeUser } = user;

    res.json({
      user: safeUser,
    });
  } catch (err) {
    console.error("Me error:", err);

    res.status(500).json({
      error: "Failed to fetch user profile",
    });
  }
});

app.post("/api/auth/become-worker", requireAuth, async (req, res) => {
  try {
    const {
      skills,
      wage,
      experience,
      location,
      bio,
    } = req.body;

    if (!skills || !skills.length) {
      return res.status(400).json({
        error: "Please select at least one skill",
      });
    }

    const updated = await addOrUpdateWorkerProfile(req.user.id, {
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

    res.status(500).json({
      error: err.message || "Failed to update worker profile",
    });
  }
});

app.get("/api/workers", optionalAuth, async (req, res) => {
  try {
    const { skill, search } = req.query;

    const workers = await getAllWorkers({
      skill,
      search,
    });

    res.json(workers);
  } catch (err) {
    console.error("Get workers error:", err);

    res.status(500).json({
      error: "Failed to fetch workers",
    });
  }
});

app.get("/api/workers/:id", async (req, res) => {
  try {
    const worker = await getWorkerById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        error: "Worker not found",
      });
    }

    res.json(worker);
  } catch (err) {
    console.error("Get worker details error:", err);

    res.status(500).json({
      error: "Failed to fetch worker details",
    });
  }
});

app.post("/api/bookings", requireAuth, async (req, res) => {
  try {
    const {
      workerId,
      skillName,
    } = req.body;

    if (!workerId) {
      return res.status(400).json({
        error: "workerId is required",
      });
    }

    const customerId = req.user.id;

    const worker = await getWorkerById(workerId);

    if (!worker) {
      return res.status(404).json({
        error: "Worker not found",
      });
    }

    if (worker.userId === customerId) {
      return res.status(403).json({
        error: "You cannot book yourself",
      });
    }

    const booking = await createBooking({
      customerId,
      workerId,
      skillName,
    });

    res.status(201).json({
      message: "Booking request placed successfully",
      booking,
    });
  } catch (err) {
    console.error("Create booking error:", err);

    res.status(500).json({
      error: err.message || "Failed to create booking",
    });
  }
});

app.get("/api/bookings/customer", requireAuth, async (req, res) => {
  try {
    const bookings = await getCustomerBookings(req.user.id);

    res.json(bookings);
  } catch (err) {
    console.error("Get customer bookings error:", err);

    res.status(500).json({
      error: "Failed to fetch customer bookings",
    });
  }
});

app.get("/api/bookings/worker", requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user || !user.workerProfile) {
      return res.json([]);
    }

    const bookings = await getWorkerBookings(
      user.workerProfile.id
    );

    res.json(bookings);
  } catch (err) {
    console.error("Get worker bookings error:", err);

    res.status(500).json({
      error: "Failed to fetch worker bookings",
    });
  }
});

app.patch(
  "/api/bookings/:id/status",
  requireAuth,
  async (req, res) => {
    try {
      const { status } = req.body;
      const { id } = req.params;

      const validStatuses = [
        "Pending",
        "Ongoing",
        "Payment Pending",
        "Completed",
        "Declined",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const booking = await getBookingById(id);

      if (!booking) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      const isCustomer =
        booking.customerId === req.user.id;

      const isWorker =
        booking.workerUserId === req.user.id;

      if (!isCustomer && !isWorker) {
        return res.status(403).json({
          error:
            "You are not authorized to modify this booking",
        });
      }

      if (isWorker) {
        if (booking.status !== "Pending") {
          return res.status(400).json({
            error:
              "Worker can only accept or decline a booking while it is Pending",
          });
        }

        if (
          status !== "Ongoing" &&
          status !== "Declined"
        ) {
          return res.status(403).json({
            error:
              "Worker can only accept or decline a Pending booking",
          });
        }
      }

      if (isCustomer) {
        if (status !== "Payment Pending") {
          return res.status(403).json({
            error:
              "Customer can only mark an Ongoing booking as Payment Pending",
          });
        }

        if (booking.status !== "Ongoing") {
          return res.status(400).json({
            error:
              "Work can only be marked finished after the worker accepts the booking",
          });
        }
      }

      if (status === "Completed") {
        return res.status(403).json({
          error:
            "A booking can only become Completed through the payment process",
        });
      }

      const updated = await updateBookingStatus(
        id,
        status
      );

      if (!updated) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      res.json({
        message: `Booking status updated to ${status}`,
        booking: updated,
      });
    } catch (err) {
      console.error(
        "Update booking status error:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Failed to update booking status",
      });
    }
  }
);

app.post(
  "/api/bookings/:id/pay",
  requireAuth,
  async (req, res) => {
    try {
      const { paymentMethod } = req.body;
      const { id } = req.params;

      const booking = await getBookingById(id);

      if (!booking) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      const isCustomer =
        booking.customerId === req.user.id;

      if (!isCustomer) {
        return res.status(403).json({
          error:
            "Only the customer who created this booking can pay",
        });
      }

      if (booking.status !== "Payment Pending") {
        return res.status(400).json({
          error:
            "Payment can only be made after the customer marks the work as finished",
        });
      }

      const method = paymentMethod || "UPI";

      if (
        method !== "UPI" &&
        method !== "Cash"
      ) {
        return res.status(400).json({
          error:
            "Payment method must be UPI or Cash",
        });
      }

      const updated = await makeBookingPayment(
        id,
        method
      );

      if (!updated) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      res.json({
        message: `Payment completed via ${method}`,
        booking: updated,
      });
    } catch (err) {
      console.error(
        "Booking payment error:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Failed to process payment",
      });
    }
  }
);

app.post(
  "/api/bookings/:id/review",
  requireAuth,
  async (req, res) => {
    try {
      const { rating, review } = req.body;
      const { id } = req.params;

      if (
        !rating ||
        Number(rating) < 1 ||
        Number(rating) > 5
      ) {
        return res.status(400).json({
          error:
            "Rating must be between 1 and 5",
        });
      }

      const booking = await getBookingById(id);

      if (!booking) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      const isCustomer =
        booking.customerId === req.user.id;

      if (!isCustomer) {
        return res.status(403).json({
          error:
            "Only the customer who created this booking can review it",
        });
      }

      if (booking.status !== "Completed") {
        return res.status(400).json({
          error:
            "You can only review a completed booking",
        });
      }

      const updated = await addBookingReview(
        id,
        Number(rating),
        review || ""
      );

      if (!updated) {
        return res.status(404).json({
          error: "Booking not found",
        });
      }

      res.json({
        message:
          "Review submitted successfully",
        booking: updated,
      });
    } catch (err) {
      console.error(
        "Booking review error:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Failed to submit review",
      });
    }
  }
);

app.listen(PORT, () => {
  console.log("===========================================");
  console.log(
    ` LabourShaala Server running on port ${PORT}`
  );
  console.log(
    ` API URL: http://localhost:${PORT}/api`
  );
  console.log("===========================================");
});
