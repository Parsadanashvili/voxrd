"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type SetValue<T> = Dispatch<SetStateAction<T>>;

const useLocalStorageStore = <T>(
  key: string,
  initValue: T
): [T, SetValue<T>] => {
  const loadValue = useCallback(() => {
    if (typeof window === "undefined") {
      return initValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      const json = parseJSON(item) as T;
      if (json === undefined) {
        window.localStorage.removeItem(key);
      }
      return item ? json : initValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initValue;
    }
  }, [initValue, key]);

  const [storedValue, setStoredValue] = useState<T>(loadValue);

  const setValueRef = useRef<SetValue<T>>();

  setValueRef.current = (value) => {
    // Prevent build error "window is undefined" but keeps working
    if (typeof window == "undefined") {
      console.warn(
        `Tried setting localStorage key “${key}” even though environment is not a client`
      );
    }

    try {
      // Allow value to be a function so we have the same API as useState
      const newValue = value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(newValue);

      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(newValue));

      // We dispatch a custom event so every useLocalStorage hook are notified
      window.dispatchEvent(new Event("local-storage"));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: SetValue<T> = useCallback(
    (value) => setValueRef.current?.(value),
    []
  );

  useEffect(() => {
    setStoredValue(loadValue());
  }, [loadValue]);

  return [storedValue, setValue];
};

export default useLocalStorageStore;

function parseJSON<T>(value: string | null): T | undefined | null {
  if (!value) return null; // don't attempt to parse a null value
  try {
    return value === "undefined" ? undefined : JSON.parse(value ?? "");
  } catch {
    console.log("parsing error on", { value });
    return undefined;
  }
}
