import React from 'react';

export function LegacyIframe({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      title="Legacy Content"
      className="w-full h-full border-0"
    />
  );
}
