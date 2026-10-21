import { useEffect, useState } from "react";
import { getNotes, createNote, updateNote, deleteNote } from "./api.js";
import NoteForm from "./NoteForm.jsx";
import NoteItem from "./NoteItem.jsx";
import Footer from "./Footer.jsx";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(""); // could not load the list
  const [actionError, setActionError] = useState(""); // add / edit / delete failed

  async function loadNotes() {
    setLoading(true);
    setLoadError("");
    try {
      setNotes(await getNotes());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  // These return true on success, so the child component knows
  // if it can clear the input or close the edit box.
  async function handleAdd(text) {
    setActionError("");
    try {
      const note = await createNote(text);
      setNotes((current) => [note, ...current]);
      return true;
    } catch (err) {
      setActionError(`Could not add the note: ${err.message}`);
      return false;
    }
  }

  async function handleSave(id, text) {
    setActionError("");
    try {
      const updated = await updateNote(id, text);
      setNotes((current) => current.map((n) => (n._id === id ? updated : n)));
      return true;
    } catch (err) {
      setActionError(`Could not save the note: ${err.message}`);
      return false;
    }
  }

  async function handleDelete(id) {
    setActionError("");
    try {
      await deleteNote(id);
      setNotes((current) => current.filter((n) => n._id !== id));
      return true;
    } catch (err) {
      setActionError(`Could not delete the note: ${err.message}`);
      return false;
    }
  }

  let content;
  if (loading) {
    content = (
      <div className="status" role="status">
        <span className="spinner" aria-hidden="true" />
        <p>Loading notes…</p>
      </div>
    );
  } else if (loadError) {
    content = (
      <div className="status status--error" role="alert">
        <p className="status__title">Could not load notes</p>
        <p>{loadError}</p>
        <button className="btn" onClick={loadNotes}>
          Try again
        </button>
      </div>
    );
  } else if (notes.length === 0) {
    content = (
      <div className="status">
        <p className="status__title">No notes yet</p>
        <p>Write your first note above.</p>
      </div>
    );
  } else {
    content = (
      <ul className="notes">
        {notes.map((note) => (
          <NoteItem key={note._id} note={note} onSave={handleSave} onDelete={handleDelete} />
        ))}
      </ul>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
          />
        </svg>
        <h1>CloudNotes</h1>
        {!loading && !loadError && (
          <span className="count">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
        )}
      </header>

      <main>
        <NoteForm onAdd={handleAdd} />

        {actionError && (
          <div className="alert" role="alert">
            <span>{actionError}</span>
            <button className="btn btn--ghost" onClick={() => setActionError("")}>
              Dismiss
            </button>
          </div>
        )}

        {content}
      </main>

      <Footer />
    </div>
  );
}
