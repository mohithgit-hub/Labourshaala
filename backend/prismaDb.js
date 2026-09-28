import crypto from "node:crypto";
import prisma from "./prismaClient.js";
import { hashPassword } from "./auth.js";

function formatUser(user) {
  if (!user) return null;

  const workerProfile = user.workerProfile
    ? {
        ...user.workerProfile,
        skills: user.workerProfile.skills?.map((s) => s.skillName) || [],
      }
    : null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    password: user.password,
    createdAt: user.createdAt,
    workerProfile,
    customerProfile: user.customerProfile || null,
  };
}

export async function getUserByEmail(email) {
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
    include: {
      workerProfile: {
        include: {
          skills: true,
        },
      },
      customerProfile: true,
    },
  });

  return formatUser(user);
}

export async function getUserByPhone(phone) {
  if (!phone) return null;

  const user = await prisma.user.findFirst({
    where: {
      phone,
    },
    include: {
      workerProfile: {
        include: {
          skills: true,
        },
      },
      customerProfile: true,
    },
  });

  return formatUser(user);
}

export async function getUserById(id) {
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      workerProfile: {
        include: {
          skills: true,
        },
      },
      customerProfile: true,
    },
  });

  return formatUser(user);
}

export async function enrichUser(user) {
  if (!user?.id) return null;
  return getUserById(user.id);
}

export async function createUser({
  name,
  email,
  phone,
  password,
  roles = "customer",
  workerData,
  customerData,
}) {
  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        password: passwordHash,
        roles,
        createdAt: now,
      },
    });

    if (
      workerData &&
      (roles.includes("worker") || workerData.skills?.length)
    ) {
      const workerProfileId = `wp-${userId}`;

      await tx.workerProfile.create({
        data: {
          id: workerProfileId,
          userId,
          bio:
            workerData.bio ||
            "Skilled daily wage professional",
          location: workerData.location || "Nearby",
          experience: workerData.experience || 1,
          wage: workerData.wage || 500,
          rating: 5,
          ratingCount: 0,
          createdAt: now,
        },
      });

      const skills = Array.isArray(workerData.skills)
        ? workerData.skills
        : workerData.skill
          ? [workerData.skill]
          : [];

      for (const skill of skills) {
        if (skill && skill.trim()) {
          await tx.workerSkill.create({
            data: {
              id: crypto.randomUUID(),
              workerId: workerProfileId,
              skillName: skill.trim(),
            },
          });
        }
      }
    }

    if (customerData || roles.includes("customer")) {
      await tx.customerProfile.create({
        data: {
          id: `cp-${userId}`,
          userId,
          address: customerData?.address || "",
          location: customerData?.location || "Nearby",
          phone: customerData?.phone || phone || null,
          createdAt: now,
        },
      });
    }
  });

  return getUserById(userId);
}

export async function addOrUpdateWorkerProfile(
  userId,
  workerData
) {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  let workerProfile = user.workerProfile;

  if (!workerProfile) {
    const workerProfileId = `wp-${userId}`;

    await prisma.$transaction(async (tx) => {
      await tx.workerProfile.create({
        data: {
          id: workerProfileId,
          userId,
          bio:
            workerData.bio ||
            "Skilled daily wage professional",
          location: workerData.location || "Nearby",
          experience: workerData.experience || 1,
          wage: workerData.wage || 500,
          rating: 5,
          ratingCount: 0,
          createdAt: now,
        },
      });

      let newRoles = user.roles;

      if (!newRoles.includes("worker")) {
        newRoles = newRoles.includes("customer")
          ? "worker,customer"
          : "worker";

        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            roles: newRoles,
          },
        });
      }
    });

    workerProfile = {
      id: workerProfileId,
    };
  } else {
    await prisma.workerProfile.update({
      where: {
        id: workerProfile.id,
      },
      data: {
        bio:
          workerData.bio !== undefined
            ? workerData.bio
            : undefined,
        location:
          workerData.location !== undefined
            ? workerData.location
            : undefined,
        experience:
          workerData.experience !== undefined
            ? workerData.experience
            : undefined,
        wage:
          workerData.wage !== undefined
            ? workerData.wage
            : undefined,
      },
    });
  }

  if (Array.isArray(workerData.skills)) {
    await prisma.$transaction(async (tx) => {
      await tx.workerSkill.deleteMany({
        where: {
          workerId: workerProfile.id,
        },
      });

      for (const skill of workerData.skills) {
        if (skill && skill.trim()) {
          await tx.workerSkill.create({
            data: {
              id: crypto.randomUUID(),
              workerId: workerProfile.id,
              skillName: skill.trim(),
            },
          });
        }
      }
    });
  }

  return getUserById(userId);
}

export async function getAllWorkers({
  skill,
  search,
} = {}) {
  const where = {};

  if (skill) {
    where.skills = {
      some: {
        skillName: {
          equals: skill.trim(),
          mode: "insensitive",
        },
      },
    };
  }

  if (search) {
    const s = search.trim();

    where.OR = [
      {
        user: {
          name: {
            contains: s,
            mode: "insensitive",
          },
        },
      },
      {
        location: {
          contains: s,
          mode: "insensitive",
        },
      },
      {
        skills: {
          some: {
            skillName: {
              contains: s,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const workers = await prisma.workerProfile.findMany({
    where,
    include: {
      user: true,
      skills: true,
    },
    orderBy: [
      {
        rating: "desc",
      },
      {
        ratingCount: "desc",
      },
    ],
  });

  return workers.map((worker) => {
    const skills = worker.skills.map(
      (s) => s.skillName
    );

    return {
      id: worker.id,
      userId: worker.userId,
      name: worker.user.name,
      email: worker.user.email,
      phone: worker.user.phone,
      skill:
        skill ||
        skills[0] ||
        "General Worker",
      skills,
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

export async function getWorkerById(workerId) {
  const worker = await prisma.workerProfile.findFirst({
    where: {
      OR: [
        {
          id: workerId,
        },
        {
          userId: workerId,
        },
      ],
    },
    include: {
      user: true,
      skills: true,
    },
  });

  if (!worker) return null;

  const skills = worker.skills.map(
    (s) => s.skillName
  );

  return {
    id: worker.id,
    userId: worker.userId,
    name: worker.user.name,
    email: worker.user.email,
    phone: worker.user.phone,
    skill: skills[0] || "General Worker",
    skills,
    rating: Number(worker.rating.toFixed(1)),
    ratingCount: worker.ratingCount,
    wage: worker.wage,
    experience: worker.experience,
    location: worker.location || "Nearby",
    bio: worker.bio || "",
    available: true,
  };
}

export async function createBooking({
  customerId,
  workerId,
  skillName,
}) {
  const workerProfile =
    await prisma.workerProfile.findFirst({
      where: {
        OR: [
          {
            id: workerId,
          },
          {
            userId: workerId,
          },
        ],
      },
      include: {
        skills: true,
      },
    });

  if (!workerProfile) {
    throw new Error("Worker profile not found");
  }

  const bookingId = `b-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;

  if (!skillName) {
    skillName =
      workerProfile.skills[0]?.skillName ||
      "General Service";
  }

  const now = new Date();

  await prisma.booking.create({
    data: {
      id: bookingId,
      customerId,
      workerId: workerProfile.id,
      skillName,
      status: "Pending",
      paymentMode: null,
      paymentStatus: "Unpaid",
      rating: null,
      review: null,
      createdAt: now,
      updatedAt: now,
    },
  });

  return getBookingById(bookingId);
}

async function formatBooking(row) {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customer.name,
    customerPhone: row.customer.phone,
    customerEmail: row.customer.email,
    workerId: row.workerId,
    workerUserId: row.worker.userId,
    worker: {
      id: row.workerId,
      userId: row.worker.userId,
      name: row.worker.user.name,
      phone: row.worker.user.phone,
      skill: row.skillName,
      wage: row.worker.wage,
      rating: Number(
        row.worker.rating.toFixed(1)
      ),
      location: row.worker.location,
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

const bookingInclude = {
  customer: true,
  worker: {
    include: {
      user: true,
    },
  },
};

export async function getBookingById(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: bookingInclude,
  });

  if (!booking) return null;

  return formatBooking(booking);
}

export async function getCustomerBookings(customerId) {
  const bookings = await prisma.booking.findMany({
    where: {
      customerId,
    },
    include: bookingInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return Promise.all(
    bookings.map(formatBooking)
  );
}

export async function getWorkerBookings(
  workerProfileId
) {
  const bookings = await prisma.booking.findMany({
    where: {
      workerId: workerProfileId,
    },
    include: bookingInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return Promise.all(
    bookings.map(formatBooking)
  );
}

export async function updateBookingStatus(
  bookingId,
  status
) {
  await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status,
      updatedAt: new Date(),
    },
  });

  return getBookingById(bookingId);
}

export async function makeBookingPayment(
  bookingId,
  paymentMode
) {
  await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      paymentMode,
      paymentStatus: "Paid",
      status: "Completed",
      updatedAt: new Date(),
    },
  });

  return getBookingById(bookingId);
}

export async function addBookingReview(
  bookingId,
  rating,
  review
) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const numRating = Number(rating);

  await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      rating: numRating,
      review: review || "",
      updatedAt: new Date(),
    },
  });

  const stats = await prisma.booking.aggregate({
    where: {
      workerId: booking.workerId,
      rating: {
        not: null,
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  if (stats._count.rating > 0) {
    await prisma.workerProfile.update({
      where: {
        id: booking.workerId,
      },
      data: {
        rating: stats._avg.rating || 5,
        ratingCount: stats._count.rating,
      },
    });
  }

  return getBookingById(bookingId);
}

export default prisma;