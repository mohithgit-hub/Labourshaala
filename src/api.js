const API_BASE = "/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("labourshaala_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const authAPI = {
  login: (emailOrPhone, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ emailOrPhone, password }),
    }),

  register: (payload) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => apiFetch("/auth/me"),

  becomeWorker: (payload) =>
    apiFetch("/auth/become-worker", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const workersAPI = {
  getWorkers: ({ skill, search } = {}) => {
    const params = new URLSearchParams();
    if (skill) params.append("skill", skill);
    if (search) params.append("search", search);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiFetch(`/workers${queryString}`);
  },

  getWorkerById: (id) => apiFetch(`/workers/${id}`),
};

export const bookingsAPI = {
  createBooking: ({ workerId, skillName }) =>
    apiFetch("/bookings", {
      method: "POST",
      body: JSON.stringify({ workerId, skillName }),
    }),

  getCustomerBookings: () => apiFetch("/bookings/customer"),

  getWorkerBookings: () => apiFetch("/bookings/worker"),

  updateStatus: (id, status) =>
    apiFetch(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  payBooking: (id, paymentMethod) =>
    apiFetch(`/bookings/${id}/pay`, {
      method: "POST",
      body: JSON.stringify({ paymentMethod }),
    }),

  submitReview: (id, rating, review) =>
    apiFetch(`/bookings/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ rating, review }),
    }),
};
