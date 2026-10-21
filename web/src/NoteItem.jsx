import { useState } from "react";

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function NoteItem({ note, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setDraft(note.text);
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    // Nothing changed - just close the edit box
    if (text === note.text) {
      setEditing(false);
      return;
    }

    setBusy(true);
    const ok = await onSave(note._id, text);
    setBusy(false);
    if (ok) setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;

    setBusy(true);
    const ok = await onDelete(note._id);
    // On success the note disappears from the list, so only reset on failure
    if (!ok) setBusy(false);
  }

  // Escape cancels, Ctrl + Enter saves
  function handleKeyDown(e) {
    if (e.key === "Escape") setEditing(false);
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave(e);
  }

  if (editing) {
    return (
      <li className="card note">
        <form onSubmit={handleSave}>
          <textarea
            className="note__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Edit note"
            rows={3}
            autoFocus
          />
          <div className="note__actions">
            <button type="button" className="btn" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy || !draft.trim()}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  const wasEdited = note.updatedAt !== note.createdAt;

  return (
    <li className="card note">
      <p className="note__text">{note.text}</p>
      <div className="note__footer">
        <p className="note__meta">
          Created <time dateTime={note.createdAt}>{formatDate(note.createdAt)}</time>
          {wasEdited && (
            <>
              {" · "}Edited <time dateTime={note.updatedAt}>{formatDate(note.updatedAt)}</time>
            </>
          )}
        </p>
        <div className="note__actions">
          <button className="btn btn--ghost" onClick={startEdit} disabled={busy}>
            Edit
          </button>
          <button className="btn btn--ghost btn--danger" onClick={handleDelete} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </li>
  );
}
