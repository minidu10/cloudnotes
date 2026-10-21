import { useEffect, useState } from "react";
import { getVersion } from "./api.js";

export default function Footer() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    // The footer is not important - if this fails, just show no version
    getVersion()
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  return (
    <footer className="footer">
      CloudNotes
      {info && (
        <>
          {" · "}version <code>{info.version}</code>
          {" · "}commit <code>{info.commit.slice(0, 7)}</code>
        </>
      )}
    </footer>
  );
}
