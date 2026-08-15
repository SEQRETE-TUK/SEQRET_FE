import { useSearchParams } from "react-router-dom";

export function useDemoQuery(name: string) {
  const [searchParams] = useSearchParams();
  return searchParams.get(name) ?? "";
}
