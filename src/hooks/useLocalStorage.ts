import { useEffect, useState } from "react";

type SetValue = (value: string | ((storedValue: string) => string)) => void;

export function useLocalStorage(key: string, initialValue: string): [string, SetValue] {
  const [state, setState] = useState<string>(initialValue);
  const setValue = (input: string | ((currentState: string) => string)) => {
    const newState = input instanceof Function ? input(state) : input;
    setState(newState);
    window.localStorage.setItem(key, JSON.stringify(newState));
  };
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setState(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      setState(initialValue);
    }
  }, [key, initialValue]);
  return [state, setValue];
}
