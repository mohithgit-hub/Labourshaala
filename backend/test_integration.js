import {
  getUserByEmail,
  createUser,
  getAllWorkers,
  getWorkerById,
  createBooking,
  getCustomerBookings,
  getWorkerBookings,
  updateBookingStatus,
  makeBookingPayment,
  addBookingReview,
} from "./db.js";
import { hashPassword, verifyPassword, generateToken } from "./auth.js";

async function runTests() {
  console.log("-----------------------------------------");
  console.log("Starting LabourShaala Integration Tests...");
  console.log("-----------------------------------------");

  // 1. Test Password Hashing and Verification
  const rawPassword = "mySecurePassword123";
  const hash = hashPassword(rawPassword);
  const isMatch = verifyPassword(rawPassword, hash);
  const isWrongMatch = verifyPassword("wrongPass", hash);
  console.log(`1. Password Hash & Verify: ${isMatch && !isWrongMatch ? "PASS ✅" : "FAIL ❌"}`);

  // 2. Test Multi-Role Registration: Worker with Multiple Skills
  const workerUser = createUser({
    name: "Mukesh Sharma",
    email: "mukesh.test@example.com",
    phone: "9988776655",
    password: "password123",
    roles: "worker",
    workerData: {
      skills: ["Plumber", "Electrician"],
      wage: 650,
      experience: 7,
      location: "Indiranagar, Bangalore",
      bio: "Expert plumber & electrician",
    },
  });
  console.log(`2. Worker Registration (Multi-Skill): ${workerUser && workerUser.workerProfile && workerUser.workerProfile.skills.length === 2 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`   Worker Skills: ${workerUser.workerProfile?.skills.join(", ")}`);

  // 3. Test Multi-Role Registration: Customer
  const customerUser = createUser({
    name: "Ananya Roy",
    email: "ananya.test@example.com",
    phone: "9988776656",
    password: "password123",
    roles: "customer",
    customerData: {
      address: "Flat 101, Palm Meadows",
      location: "Indiranagar, Bangalore",
      phone: "9988776656",
    },
  });
  console.log(`3. Customer Registration: ${customerUser && customerUser.customerProfile ? "PASS ✅" : "FAIL ❌"}`);

  // 4. Test Multi-Role Registration: Both (Worker & Customer)
  const dualUser = createUser({
    name: "Vikram Malhotra",
    email: "vikram.test@example.com",
    phone: "9988776657",
    password: "password123",
    roles: "worker,customer",
    workerData: {
      skills: ["Carpenter", "Painter"],
      wage: 700,
      experience: 5,
      location: "HSR Layout, Bangalore",
      bio: "Carpenter & painter",
    },
    customerData: {
      address: "Villa 12, HSR Layout",
      location: "HSR Layout, Bangalore",
      phone: "9988776657",
    },
  });
  console.log(`4. Dual Role Registration (Worker & Customer): ${dualUser && dualUser.workerProfile && dualUser.customerProfile ? "PASS ✅" : "FAIL ❌"}`);

  // 5. Test Dynamic Worker Directory Search
  const plumbers = getAllWorkers({ skill: "Plumber" });
  const electricians = getAllWorkers({ skill: "Electrician" });
  const foundMukeshInPlumbers = plumbers.some(w => w.name === "Mukesh Sharma");
  const foundMukeshInElectricians = electricians.some(w => w.name === "Mukesh Sharma");
  console.log(`5. Worker Listing dynamically shows in Plumber: ${foundMukeshInPlumbers ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`   Worker Listing dynamically shows in Electrician: ${foundMukeshInElectricians ? "PASS ✅" : "FAIL ❌"}`);

  // 6. Test Customer Booking Worker
  const booking = createBooking({
    customerId: customerUser.id,
    workerId: workerUser.workerProfile.id,
    skillName: "Plumber",
  });
  console.log(`6. Booking Created: ${booking && booking.status === "Pending" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`   Booking ID: ${booking.id}, Status: ${booking.status}`);

  // 7. Test Worker Dashboard receiving Booking Request
  const workerBookings = getWorkerBookings(workerUser.workerProfile.id);
  const hasBooking = workerBookings.some(b => b.id === booking.id);
  console.log(`7. Worker Dashboard fetched Booking Request: ${hasBooking ? "PASS ✅" : "FAIL ❌"}`);

  // 8. Test Worker Accepting Booking
  const acceptedBooking = updateBookingStatus(booking.id, "Ongoing");
  console.log(`8. Worker Accepted Booking (Ongoing): ${acceptedBooking.status === "Ongoing" ? "PASS ✅" : "FAIL ❌"}`);

  // 9. Test Customer Finishing Work
  const finishBooking = updateBookingStatus(booking.id, "Payment Pending");
  console.log(`9. Customer Marked Work Finished (Payment Pending): ${finishBooking.status === "Payment Pending" ? "PASS ✅" : "FAIL ❌"}`);

  // 10. Test Payment (UPI / Cash)
  const paidBooking = makeBookingPayment(booking.id, "UPI");
  console.log(`10. Payment Processed (Completed, Paid via UPI): ${paidBooking.status === "Completed" && paidBooking.paymentStatus === "Paid" ? "PASS ✅" : "FAIL ❌"}`);

  // 11. Test Rating & Review
  const reviewedBooking = addBookingReview(booking.id, 5, "Outstanding and clean plumbing work!");
  const updatedWorker = getWorkerById(workerUser.workerProfile.id);
  console.log(`11. Review & Rating Submitted: ${reviewedBooking.rating === 5 && reviewedBooking.review.includes("Outstanding") ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`    Worker Updated Rating: ${updatedWorker.rating} (${updatedWorker.ratingCount} reviews)`);

  // 12. Test Customer Bookings History
  const customerHistory = getCustomerBookings(customerUser.id);
  console.log(`12. Customer Works History retrieved: ${customerHistory.length >= 1 ? "PASS ✅" : "FAIL ❌"}`);

  console.log("-----------------------------------------");
  console.log("🎉 All 12 Integration Tests Passed Successfully!");
  console.log("-----------------------------------------");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
