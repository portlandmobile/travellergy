import React from 'react';

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const FilterPill: React.FC<FilterPillProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-full border-2 px-4 py-1.5 text-sm cursor-pointer transition-colors ${
      isActive
        ? 'border-travellergy-accent bg-travellergy-accent text-white'
        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);
