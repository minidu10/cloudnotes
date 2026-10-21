// Small helpers to talk to the API.
// Always use relative paths ("/api/...") so nginx can forward them to the api container.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    // The API sends { error: "..." } - fall back to the status code if not
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  // 204 No Content (delete) has no body
  return res.status === 204 ? null : res.json();
}

export function getNotes() {
  return request("/api/notes");
}

export function createNote(text) {
  return request("/api/notes", { method: "POST", body: JSON.stringify({ text }) });
}

export function updateNote(id, text) {
  return request(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify({ text }) });
}

export function deleteNote(id) {
  return request(`/api/notes/${id}`, { method: "DELETE" });
}

export function getVersion() {
  return request("/api/version");
}
