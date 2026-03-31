import React from 'react';

interface SafetyIndicatorProps {
  risk: 'HIGH' | 'UNKNOWN' | 'SAFE';
  message: string;
}

export const SafetyIndicator: React.FC<SafetyIndicatorProps> = ({ risk, message }) => {
  if (risk === 'SAFE') return null;

  return (
    <div className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${risk === 'HIGH' ? 'bg-travellergy-accent/10 text-travellergy-accent' : 'bg-gray-100 text-gray-500'}`}>
      <span>{risk === 'HIGH' ? '⚠️' : 'ℹ️'}</span>
      <span className="font-semibold">{message}</span>
    </div>
  );
};
