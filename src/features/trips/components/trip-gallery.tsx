import { StarIcon } from "lucide-react";

import type { TripPhoto } from "../queries";

export function TripGallery({ photos }: { photos: TripPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <li key={photo.id} className="relative">
          <a
            href={photo.url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <img
              src={photo.url}
              alt={`Trip photo ${index + 1}${photo.isCover ? " (cover)" : ""}`}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform hover:scale-[1.02]"
            />
          </a>
          {photo.isCover ? (
            <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border border-foreground bg-background px-2 py-0.5 text-xs font-medium">
              <StarIcon aria-hidden className="size-3 fill-current" />
              Cover
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
