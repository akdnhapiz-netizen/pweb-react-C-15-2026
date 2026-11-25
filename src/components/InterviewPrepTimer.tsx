import { useState, useEffect } from "react";

const INTERVIEW_QUESTIONS: string[] = [
  "Ceritakan bug tersulit saat mengelola state di proyek React yang pernah kamu buat, dan bagaimana kamu memperbaikinya?",
  "Apa perbedaan utama antara props dan state di React, serta kapan kamu memilih menggunakan Custom Hook?",
  "Mengapa mutasi langsung pada array atau objek state (seperti array.push) dapat menyebabkan masalah rendering di React?",
  "Bagaimana cara kerja useEffect cleanup function dan kasus nyata apa yang membutuhkan cleanup tersebut?",
  "Jelaskan perbedaan interface dan type di TypeScript, serta mengapa penggunaan tipe any sebaiknya dihindari pada proyek tim.",
  "Bagaimana langkahmu mengoptimalkan aplikasi web frontend yang terasa lambat saat melakukan pencarian data dari API?",
];

const INITIAL_SECONDS = 120; // 02:00

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function InterviewPrepTimer() {
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(INITIAL_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning]);

  const handleToggleStartPause = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(INITIAL_SECONDS);
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
  };

  const handleNextQuestion = () => {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
    setQuestionIndex((prev) => (prev + 1) % INTERVIEW_QUESTIONS.length);
  };

  const isLowTime = secondsLeft > 0 && secondsLeft <= 20;
  const isTimeUp = secondsLeft === 0;

  return (
    <section className="card-section prep-timer-box" aria-label="Latihan Interview">
      <div className="section-header-row">
        <h3 className="section-title">LATIHAN INTERVIEW</h3>
        <span className="muted-badge">
          Soal {questionIndex + 1} / {INTERVIEW_QUESTIONS.length}
        </span>
      </div>

      <p className="interview-question-text">
        &ldquo;{INTERVIEW_QUESTIONS[questionIndex]}&rdquo;
      </p>

      <div className="timer-control-row">
        <div
          className={`timer-display ${isLowTime ? "timer-warning" : ""} ${
            isTimeUp ? "timer-expired" : ""
          }`}
        >
          {formatTime(secondsLeft)}
        </div>

        <div className="timer-buttons">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleToggleStartPause}
          >
            {isRunning ? "Jeda" : secondsLeft === 0 ? "Ulangi" : "Mulai"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNextQuestion}
          >
            Soal Berikutnya
          </button>
        </div>
      </div>

      {isTimeUp && (
        <p className="error-text" style={{ marginTop: "0.5rem" }}>
          Waktu 02:00 habis! Klik &ldquo;Ulangi&rdquo; atau lanjut ke &ldquo;Soal Berikutnya&rdquo;.
        </p>
      )}
    </section>
  );
}