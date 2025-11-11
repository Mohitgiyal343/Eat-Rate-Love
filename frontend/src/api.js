const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

let authToken = localStorage.getItem("token") || "";

export function setAuthToken(token) {
  authToken = token || "";
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

function authHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export async function analyzeSentiment(review) {
  const res = await fetch(`${API_BASE}/sentiment/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review }),
  });
  if (!res.ok) throw new Error("Sentiment request failed");
  return res.json();
}

// -------- Auth --------
export async function authSignup({ username, email, password }) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw new Error("Signup failed");
  const data = await res.json();
  return data;
}

export async function authLogin({ username, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  return data;
}

export async function authMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

// -------- Social (placeholders for later UI) --------
export async function createPost({ image_url, caption }) {
  const res = await fetch(`${API_BASE}/posts/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ image_url, caption }),
  });
  if (!res.ok) throw new Error("Create post failed");
  return res.json();
}

export async function getFeed({ limit = 25, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${API_BASE}/posts/feed?${params.toString()}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Feed fetch failed");
  return res.json();
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/media/upload`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: form,
  });
  if (!res.ok) throw new Error("Image upload failed");
  return res.json(); // { url }
}

export async function searchRestaurants({ q, city, limit = 25, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const res = await fetch(`${API_BASE}/yelp/restaurants?${params.toString()}`);
  if (!res.ok) throw new Error("Restaurant search failed");
  return res.json();
}

export async function uploadReview(review) {
  const res = await fetch(`${API_BASE}/upload/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review }),
  });
  if (!res.ok) throw new Error("Upload review failed");
  return res.json();
}

export async function listReviews({ limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const res = await fetch(`${API_BASE}/upload/reviews?${params.toString()}`);
  if (!res.ok) throw new Error("List reviews failed");
  return res.json();
}


