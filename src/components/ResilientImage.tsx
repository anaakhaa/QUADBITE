import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
}

export function ResilientImage({
  src,
  alt,
  fallbackLabel,
  className = '',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-6 text-center ${className}`}
      >
        <UtensilsCrossed className="w-7 h-7 text-slate-400 mb-2" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
