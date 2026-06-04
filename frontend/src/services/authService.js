const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const loginUser = (email, password) =>
  request("/auth/login", { email, password });

export const registerUser = (name, email, password) =>
  request("/auth/register", { name, email, password });