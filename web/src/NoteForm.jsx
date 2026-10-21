import { useState } from "react";

export default function NoteForm({ onAdd }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || saving) return;

    setSaving(true);
    const ok = await onAdd(text.trim());
    setSaving(false);
    if (ok) setText("");
  }

  // Ctrl + Enter (or Cmd + Enter on Mac) adds the note
  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(e);
  }

  return (
    <form className="card composer" onSubmit={handleSubmit}>
      <label htmlFor="new-note" className="sr-only">
        New note
      </label>
      <textarea
        id="new-note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a note…"
        rows={3}
      />
      <div className="composer__actions">
        <span className="hint">Ctrl + Enter to add</span>
        <button type="submit" className="btn btn--primary" disabled={saving || !text.trim()}>
          {saving ? "Adding…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
