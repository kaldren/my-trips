"use client";

import { ImagePlusIcon, StarIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ACCEPTED_IMAGE_TYPES, MAX_PHOTOS } from "../schemas";

export type PickedPhoto = {
  id: string;
  file: File;
  /** Object URL for the thumbnail; the owner revokes it on removal. */
  previewUrl: string;
};

export function PhotoPicker({
  photos,
  coverId,
  onAdd,
  onRemove,
  onSetCover,
  problems,
  disabled,
}: {
  photos: PickedPhoto[];
  coverId: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
  problems?: string[];
  disabled?: boolean;
}) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const problemsId = `${inputId}-problems`;
  const [dragging, setDragging] = useState(false);
  const full = photos.length >= MAX_PHOTOS;

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="mb-2 text-sm leading-none font-medium">Photos</legend>

      {!full ? (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled) onAdd(Array.from(event.dataTransfer.files));
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            "has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 hover:border-foreground hover:bg-muted",
            dragging && "border-foreground bg-accent/30",
          )}
        >
          <ImagePlusIcon aria-hidden className="size-6" />
          <span className="text-sm font-medium">
            Drop photos here or <span className="underline underline-offset-4">browse</span>
          </span>
          <span id={hintId} className="text-xs">
            JPEG, PNG or WebP · up to {MAX_PHOTOS} photos · location data is removed
          </span>
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            aria-describedby={[hintId, problems?.length ? problemsId : null]
              .filter(Boolean)
              .join(" ")}
            onChange={(event) => {
              onAdd(Array.from(event.target.files ?? []));
              // Allow picking the same file again after removing it.
              event.target.value = "";
            }}
          />
        </label>
      ) : null}

      {problems?.length ? (
        <ul id={problemsId} className="flex flex-col gap-1 text-sm text-destructive">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      {photos.length > 0 ? (
        <>
          <p className="text-xs">
            {photos.length}/{MAX_PHOTOS} photos · choose a photo to make it the cover
          </p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo, index) => {
              const isCover = photo.id === coverId;
              return (
                <li key={photo.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSetCover(photo.id)}
                    aria-pressed={isCover}
                    aria-label={`Photo ${index + 1}${isCover ? ", cover" : ", make cover"}`}
                    className={cn(
                      "block w-full overflow-hidden rounded-lg border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isCover ? "border-foreground" : "border-transparent",
                    )}
                  >
                    <img
                      src={photo.previewUrl}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                  {isCover ? (
                    <span className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full border border-foreground bg-background px-1.5 py-0.5 text-xs font-medium">
                      <StarIcon aria-hidden className="size-3 fill-current" />
                      Cover
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={() => onRemove(photo.id)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute top-1.5 right-1.5 rounded-full border-foreground bg-background"
                  >
                    <XIcon aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </fieldset>
  );
}
