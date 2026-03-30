import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

// ─── Context shape ─────────────────────────────────────────────────────────────
interface EmergencyModeContextValue {
  /** True while the user has explicitly entered Emergency Mode */
  isEmergencyModeActive: boolean;
  /** Call this to trigger Emergency Mode (e.g. from the dashboard button) */
  enterEmergencyMode: () => void;
  /**
   * Call this when the user has confirmed they are stable and set a new budget.
   * This clears emergency mode and returns the app to normal.
   */
  exitEmergencyMode: () => void;
}

const EmergencyModeContext = createContext<EmergencyModeContextValue>({
  isEmergencyModeActive: false,
  enterEmergencyMode: () => {},
  exitEmergencyMode: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const EmergencyModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isEmergencyModeActive, setIsEmergencyModeActive] = useState(false);

  const enterEmergencyMode = useCallback(() => {
    setIsEmergencyModeActive(true);
  }, []);

  const exitEmergencyMode = useCallback(() => {
    setIsEmergencyModeActive(false);
  }, []);

  const value = useMemo(
    () => ({ isEmergencyModeActive, enterEmergencyMode, exitEmergencyMode }),
    [isEmergencyModeActive, enterEmergencyMode, exitEmergencyMode]
  );

  return (
    <EmergencyModeContext.Provider value={value}>
      {children}
    </EmergencyModeContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useEmergencyMode(): EmergencyModeContextValue {
  return useContext(EmergencyModeContext);
}
