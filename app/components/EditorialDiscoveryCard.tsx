import React from 'react';

export const EditorialDiscoveryCard = ({ title, badge, imageSrc }: { title: string; badge: string; imageSrc: string }) => (
  <div className="group w-full cursor-pointer overflow-hidden rounded-lg transition-transform duration-300 ease-out hover:scale-[1.02]">
    <div className="aspect-video w-full overflow-hidden rounded-lg">
      <img src={imageSrc} alt={title} className="h-full w-full object-cover" />
    </div>
    <div className="mt-3">
      <div className="mb-1 inline-block rounded-sm bg-travellergy-sage/10 px-2 py-0.5 text-xs font-semibold text-travellergy-sage">
        {badge}
      </div>
      <h3 className="font-serif text-lg text-travellergy-text">{title}</h3>
    </div>
  </div>
);
