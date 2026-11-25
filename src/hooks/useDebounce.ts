import { useEffect, useState } from "react";

/**
 * Mengembalikan `value` yang baru ter-update setelah `delay` ms tanpa perubahan.
 * Setiap kali value berubah, timer lama dibersihkan (cleanup) lalu timer baru dibuat.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timerId);
  }, [value, delay]);

  return debouncedValue;
}
