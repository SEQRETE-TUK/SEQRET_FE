import { createContext, useContext } from "react";

export type DemoFeedbackContextValue = (message: string) => void;

export const DemoFeedbackContext = createContext<DemoFeedbackContextValue>(() => undefined);

export function useDemoFeedback() {
  return useContext(DemoFeedbackContext);
}
