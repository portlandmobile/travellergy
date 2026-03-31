"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const FilterContext = createContext<{
  activeAllergens: string[];
  toggleAllergen: (allergen: string) => void;
}>({
  activeAllergens: [],
  toggleAllergen: () => {},
});

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeAllergens, setActiveAllergens] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('travellergy-allergens');
    if (saved) setActiveAllergens(JSON.parse(saved));
  }, []);

  const toggleAllergen = (allergen: string) => {
    setActiveAllergens((prev) => {
      const next = prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen];
      localStorage.setItem('travellergy-allergens', JSON.stringify(next));
      return next;
    });
  };

  return (
    <FilterContext.Provider value={{ activeAllergens, toggleAllergen }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useAllergenFilter = () => useContext(FilterContext);
