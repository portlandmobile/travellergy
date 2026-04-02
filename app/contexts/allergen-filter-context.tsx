"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ALLERGEN_FILTERS,
  type AllergenFilterId,
} from "@/lib/allergen-taxonomy";

const STORAGE_KEY = "travellergy_allergen_filter";

const VALID_IDS = new Set<string>(ALLERGEN_FILTERS.map((f) => f.id));

function parseStored(raw: string | null): AllergenFilterId | null {
  if (!raw || raw === "all") return null;
  if (VALID_IDS.has(raw)) return raw as AllergenFilterId;
  return null;
}

export type AllergenFilterContextValue = {
  /** `null` means All (no allergen filter). */
  selectedAllergen: AllergenFilterId | null;
  setSelectedAllergen: (id: AllergenFilterId | null) => void;
};

const AllergenFilterContext = createContext<AllergenFilterContextValue | null>(
  null,
);

export function AllergenFilterProvider({ children }: { children: ReactNode }) {
  const [selectedAllergen, setSelectedAllergenState] =
    useState<AllergenFilterId | null>(null);

  useEffect(() => {
    setSelectedAllergenState(parseStored(localStorage.getItem(STORAGE_KEY)));
  }, []);

  const setSelectedAllergen = useCallback((id: AllergenFilterId | null) => {
    setSelectedAllergenState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id === null ? "all" : id);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const value = useMemo(
    () => ({ selectedAllergen, setSelectedAllergen }),
    [selectedAllergen, setSelectedAllergen],
  );

  return (
    <AllergenFilterContext.Provider value={value}>
      {children}
    </AllergenFilterContext.Provider>
  );
}

export function useAllergenFilter(): AllergenFilterContextValue {
  const ctx = useContext(AllergenFilterContext);
  if (!ctx) {
    throw new Error(
      "useAllergenFilter must be used within AllergenFilterProvider",
    );
  }
  return ctx;
}
