import { useEffect, useState } from "react";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");

  async function loadNotes() {
    const res = await fetch("/api/notes");
    setNotes(await res.json());
  }

  async function addNote(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setText("");
    loadNotes();
  }

  useEffect(() => {
    loadNotes();
  }, []);

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>☁️ CloudNotes</h1>
      <form onSubmit={addNote}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note..."
          style={{ padding: 8, width: "70%" }}
        />
        <button style={{ padding: 8, marginLeft: 8 }}>Add</button>
      </form>
      <ul>
        {notes.map((n) => (
          <li key={n._id}>{n.text}</li>
        ))}
      </ul>
    </div>
  );
}