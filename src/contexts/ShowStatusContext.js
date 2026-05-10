"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const ShowStatusContext = createContext(() => {});

export function useShowStatus() {
  return useContext(ShowStatusContext);
}

export function ShowStatusProvider({ children }) {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(undefined);

  const showStatus = useCallback((message) => {
    setText(message);
    setVisible(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), 1600);
  }, []);

  return (
    <ShowStatusContext.Provider value={showStatus}>
      {children}
      <div className={`status${visible ? " show" : ""}`}>{text}</div>
    </ShowStatusContext.Provider>
  );
}
