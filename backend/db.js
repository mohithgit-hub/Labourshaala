import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { hashPassword } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, "labourshaala.db");

// Initialize Database
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrency and foreign keys
db.exec("PRAGMA foreign_keys = ON;");

// Initialize schema (No fake/mock data - purely for real users)
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      roles TEXT NOT NULL DEFAULT 'customer',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS worker_profiles (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      bio TEXT,
      location TEXT,
      experience INTEGER DEFAULT 1,
      wage REAL DEFAULT 500,
      rating REAL DEFAULT 5.0,
      ratingCount INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customer_profiles (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      address TEXT,
      location TEXT,
      phone TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS worker_skills (
      id TEXT PRIMARY KEY,
      workerId TEXT NOT NULL,
      skillName TEXT NOT NULL,
      FOREIGN KEY (workerId) REFERENCES worker_profiles(id) ON DELETE CASCADE,
      UNIQUE(workerId, skillName)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      workerId TEXT NOT NULL,
      skillName TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      paymentMode TEXT,
      paymentStatus TEXT NOT NULL DEFAULT 'Unpaid',
      rating INTEGER,
      review TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workerId) REFERENCES worker_profiles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_worker_skills_skill ON worker_skills(skillName);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customerId);
    CREATE INDEX IF NOT EXISTS idx_bookings_worker ON bookings(workerId);
  `);
}

// Run schema initialization without mock/fake seed data
initSchema();

// ==========================================
// DB Helper Functions
// ==========================================

export function getUserByEmail(email) {
  if (!email) return null;
  const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email);
  return user ? enrichUser(user) : null;
}

export function getUserByPhone(phone) {
  if (!phone) return null;
  const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
  return user ? enrichUser(user) : null;
}

export function getUserById(id) {
  if (!id) return null;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return user ? enrichUser(user) : null;
}

export function enrichUser(user) {
  const workerProfile = db.prepare("SELECT * FROM worker_profiles WHERE userId = ?").get(user.id);
  let skills = [];
  if (workerProfile) {
    const skillRows = db.prepare("SELECT skillName FROM worker_skills WHERE workerId = ?").all(workerProfile.id);
    skills = skillRows.map(r => r.skillName);
    workerProfile.skills = skills;
  }

  const customerProfile = db.prepare("SELECT * FROM customer_profiles WHERE userId = ?").get(user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    password: user.password,
    createdAt: user.createdAt,
    workerProfile: workerProfile || null,
    customerProfile: customerProfile || null,
  };
}

export function createUser({ name, email, phone, password, roles = "customer", workerData, customerData }) {
  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password, roles, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, name, email, phone || null, passwordHash, roles, now);

  // If worker data provided
  if (workerData && (roles.includes("worker") || workerData.skills?.length)) {
    const workerProfileId = `wp-${userId}`;
    db.prepare(`
      INSERT INTO worker_profiles (id, userId, bio, location, experience, wage, rating, ratingCount, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workerProfileId,
      userId,
      workerData.bio || "Skilled daily wage professional",
      workerData.location || "Nearby",
      workerData.experience || 1,
      workerData.wage || 500,
      5.0,
      0,
      now
    );

    const skills = Array.isArray(workerData.skills) ? workerData.skills : (workerData.skill ? [workerData.skill] : []);
    for (const skill of skills) {
      if (skill && skill.trim()) {
        db.prepare(`
          INSERT OR IGNORE INTO worker_skills (id, workerId, skillName)
          VALUES (?, ?, ?)
        `).run(crypto.randomUUID(), workerProfileId, skill.trim());
      }
    }
  }

  // If customer data provided
  if (customerData || roles.includes("customer")) {
    db.prepare(`
      INSERT INTO customer_profiles (id, userId, address, location, phone, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `cp-${userId}`,
      userId,
      customerData?.address || "",
      customerData?.location || "Nearby",
      customerData?.phone || phone || null,
      now
    );
  }

  return getUserById(userId);
}

export function addOrUpdateWorkerProfile(userId, workerData) {
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");

  const now = new Date().toISOString();
  let workerProfile = user.workerProfile;

  if (!workerProfile) {
    const workerProfileId = `wp-${userId}`;
    db.prepare(`
      INSERT INTO worker_profiles (id, userId, bio, location, experience, wage, rating, ratingCount, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workerProfileId,
      userId,
      workerData.bio || "Skilled daily wage professional",
      workerData.location || "Nearby",
      workerData.experience || 1,
      workerData.wage || 500,
      5.0,
      0,
      now
    );
    workerProfile = { id: workerProfileId };

    // Update user role if needed
    let newRoles = user.roles;
    if (!newRoles.includes("worker")) {
      newRoles = newRoles.includes("customer") ? "worker,customer" : "worker";
      db.prepare("UPDATE users SET roles = ? WHERE id = ?").run(newRoles, userId);
    }
  } else {
    db.prepare(`
      UPDATE worker_profiles
      SET bio = COALESCE(?, bio),
          location = COALESCE(?, location),
          experience = COALESCE(?, experience),
          wage = COALESCE(?, wage)
      WHERE id = ?
    `).run(
      workerData.bio ?? null,
      workerData.location ?? null,
      workerData.experience ?? null,
      workerData.wage ?? null,
      workerProfile.id
    );
  }

  // Update skills if provided
  if (workerData.skills && Array.isArray(workerData.skills)) {
    db.prepare("DELETE FROM worker_skills WHERE workerId = ?").run(workerProfile.id);
    for (const skill of workerData.skills) {
      if (skill && skill.trim()) {
        db.prepare(`
          INSERT OR IGNORE INTO worker_skills (id, workerId, skillName)
          VALUES (?, ?, ?)
        `).run(crypto.randomUUID(), workerProfile.id, skill.trim());
      }
    }
  }

  return getUserById(userId);
}

export function getAllWorkers({ skill, search } = {}) {
  let query = `
    SELECT 
      wp.id as profileId,
      wp.userId,
      u.name,
      u.email,
      u.phone,
      wp.bio,
      wp.location,
      wp.experience,
      wp.wage,
      wp.rating,
      wp.ratingCount,
      wp.createdAt
    FROM worker_profiles wp
    JOIN users u ON wp.userId = u.id
  `;

  const conditions = [];
  const params = [];

  if (skill) {
    conditions.push(`
      wp.id IN (
        SELECT workerId FROM worker_skills 
        WHERE LOWER(skillName) = LOWER(?)
      )
    `);
    params.push(skill.trim());
  }

  if (search) {
    conditions.push(`(
      LOWER(u.name) LIKE LOWER(?) OR 
      LOWER(wp.location) LIKE LOWER(?) OR 
      wp.id IN (
        SELECT workerId FROM worker_skills 
        WHERE LOWER(skillName) LIKE LOWER(?)
      )
    )`);
    const s = `%${search.trim()}%`;
    params.push(s, s, s);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY wp.rating DESC, wp.ratingCount DESC";

  const rows = db.prepare(query).all(...params);

  // Attach skills to each worker
  return rows.map(worker => {
    const skillRows = db.prepare("SELECT skillName FROM worker_skills WHERE workerId = ?").all(worker.profileId);
    const skills = skillRows.map(r => r.skillName);
    return {
      id: worker.profileId,
      userId: worker.userId,
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      skill: skill || skills[0] || "General Worker",
      skills: skills,
      rating: Number(worker.rating.toFixed(1)),
      ratingCount: worker.ratingCount,
      wage: worker.wage,
      experience: worker.experience,
      location: worker.location || "Nearby",
      bio: worker.bio || "",
      available: true,
    };
  });
}

export function getWorkerById(workerId) {
  let row = db.prepare(`
    SELECT 
      wp.id as profileId,
      wp.userId,
      u.name,
      u.email,
      u.phone,
      wp.bio,
      wp.location,
      wp.experience,
      wp.wage,
      wp.rating,
      wp.ratingCount,
      wp.createdAt
    FROM worker_profiles wp
    JOIN users u ON wp.userId = u.id
    WHERE wp.id = ? OR wp.userId = ?
  `).get(workerId, workerId);

  if (!row) return null;

  const skillRows = db.prepare("SELECT skillName FROM worker_skills WHERE workerId = ?").all(row.profileId);
  const skills = skillRows.map(r => r.skillName);

  return {
    id: row.profileId,
    userId: row.userId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    skill: skills[0] || "General Worker",
    skills: skills,
    rating: Number(row.rating.toFixed(1)),
    ratingCount: row.ratingCount,
    wage: row.wage,
    experience: row.experience,
    location: row.location || "Nearby",
    bio: row.bio || "",
    available: true,
  };
}

export function createBooking({ customerId, workerId, skillName }) {
  let workerProfile = db.prepare("SELECT * FROM worker_profiles WHERE id = ? OR userId = ?").get(workerId, workerId);
  if (!workerProfile) {
    throw new Error("Worker profile not found");
  }

  const bookingId = `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  if (!skillName) {
    const firstSkill = db.prepare("SELECT skillName FROM worker_skills WHERE workerId = ? LIMIT 1").get(workerProfile.id);
    skillName = firstSkill ? firstSkill.skillName : "General Service";
  }

  db.prepare(`
    INSERT INTO bookings (id, customerId, workerId, skillName, status, paymentMode, paymentStatus, rating, review, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    bookingId,
    customerId,
    workerProfile.id,
    skillName,
    "Pending",
    null,
    "Unpaid",
    null,
    null,
    now,
    now
  );

  return getBookingById(bookingId);
}

export function getBookingById(bookingId) {
  const row = db.prepare(`
    SELECT 
      b.*,
      c.name as customerName,
      c.phone as customerPhone,
      c.email as customerEmail,
      w.userId as workerUserId,
      wu.name as workerName,
      wu.phone as workerPhone,
      w.wage as workerWage,
      w.rating as workerRating,
      w.location as workerLocation
    FROM bookings b
    JOIN users c ON b.customerId = c.id
    JOIN worker_profiles w ON b.workerId = w.id
    JOIN users wu ON w.userId = wu.id
    WHERE b.id = ?
  `).get(bookingId);

  if (!row) return null;

  return formatBooking(row);
}

export function getCustomerBookings(customerId) {
  const rows = db.prepare(`
    SELECT 
      b.*,
      c.name as customerName,
      c.phone as customerPhone,
      c.email as customerEmail,
      w.userId as workerUserId,
      wu.name as workerName,
      wu.phone as workerPhone,
      w.wage as workerWage,
      w.rating as workerRating,
      w.location as workerLocation
    FROM bookings b
    JOIN users c ON b.customerId = c.id
    JOIN worker_profiles w ON b.workerId = w.id
    JOIN users wu ON w.userId = wu.id
    WHERE b.customerId = ?
    ORDER BY b.createdAt DESC
  `).all(customerId);

  return rows.map(formatBooking);
}

export function getWorkerBookings(workerProfileId) {
  const rows = db.prepare(`
    SELECT 
      b.*,
      c.name as customerName,
      c.phone as customerPhone,
      c.email as customerEmail,
      w.userId as workerUserId,
      wu.name as workerName,
      wu.phone as workerPhone,
      w.wage as workerWage,
      w.rating as workerRating,
      w.location as workerLocation
    FROM bookings b
    JOIN users c ON b.customerId = c.id
    JOIN worker_profiles w ON b.workerId = w.id
    JOIN users wu ON w.userId = wu.id
    WHERE b.workerId = ?
    ORDER BY b.createdAt DESC
  `).all(workerProfileId);

  return rows.map(formatBooking);
}

function formatBooking(row) {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    workerId: row.workerId,
    workerUserId: row.workerUserId,
    worker: {
      id: row.workerId,
      userId: row.workerUserId,
      name: row.workerName,
      phone: row.workerPhone,
      skill: row.skillName,
      wage: row.workerWage,
      rating: Number(row.workerRating.toFixed(1)),
      location: row.workerLocation,
    },
    status: row.status,
    paymentMethod: row.paymentMode,
    paymentStatus: row.paymentStatus,
    rating: row.rating,
    review: row.review,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function updateBookingStatus(bookingId, status) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE bookings 
    SET status = ?, updatedAt = ?
    WHERE id = ?
  `).run(status, now, bookingId);

  return getBookingById(bookingId);
}

export function makeBookingPayment(bookingId, paymentMode) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE bookings 
    SET paymentMode = ?, paymentStatus = 'Paid', status = 'Completed', updatedAt = ?
    WHERE id = ?
  `).run(paymentMode, now, bookingId);

  return getBookingById(bookingId);
}

export function addBookingReview(bookingId, rating, review) {
  const booking = getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const numRating = Number(rating);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE bookings
    SET rating = ?, review = ?, updatedAt = ?
    WHERE id = ?
  `).run(numRating, review || "", now, bookingId);

  // Recalculate worker's average rating
  const stats = db.prepare(`
    SELECT AVG(rating) as avgRating, COUNT(*) as count
    FROM bookings
    WHERE workerId = ? AND rating IS NOT NULL
  `).get(booking.workerId);

  if (stats && stats.count > 0) {
    db.prepare(`
      UPDATE worker_profiles
      SET rating = ?, ratingCount = ?
      WHERE id = ?
    `).run(stats.avgRating, stats.count, booking.workerId);
  }

  return getBookingById(bookingId);
}

export default db;
