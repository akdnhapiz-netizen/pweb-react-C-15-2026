import { useEffect, useState } from "react";

interface UndoToastProps {
  company: string;
  durationMs: number;
  onUndo: () => void;
}

/**
 * Hanya menampilkan sisa detik. Timer yang benar-benar menghapus permanen
 * ada di App (disimpan di useRef). Pakai `key` berbeda tiap delete supaya
 * hitungan mundur mulai ulang dari 5.
 */
export function UndoToast({ company, durationMs, onUndo }: UndoToastProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(durationMs / 1000));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalId); // cleanup saat toast hilang
  }, []);

  return (
    <div className="undo-toast" role="status">
      <span>
        Lamaran <strong>{company}</strong> telah dihapus.
      </span>
      <button type="button" className="undo-btn" onClick={onUndo}>
        Undo ({secondsLeft}d)
      </button>
    </div>
  );
}
