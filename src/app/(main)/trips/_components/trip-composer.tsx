"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  LoaderCircleIcon,
  MapIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import { PlaceSearch } from "@/features/map/components/place-search";
import { TripsMapLazy } from "@/features/map/components/trips-map-lazy";
import type { MapPoint } from "@/features/map/utils";
import {
  attachTripPhotos,
  createTrip,
  updateTrip,
} from "@/features/trips/actions";
import { PhotoPicker } from "@/features/trips/components/photo-picker";
import {
  TripDatesFields,
  TripMessageField,
  TripTitleField,
  TripVisibilityField,
} from "@/features/trips/components/trip-details-fields";
import { TripPreviewCard } from "@/features/trips/components/trip-preview-card";
import { prepareImageForUpload } from "@/features/trips/image";
import { selectPhotoFiles } from "@/features/trips/photo-files";
import {
  TRIP_PHOTOS_BUCKET,
  buildTripPhotoPath,
} from "@/features/trips/photo-paths";
import {
  tripDetailsSchema,
  type TripDetailsFieldErrors,
  type TripVisibility,
} from "@/features/trips/schemas";
import { addVisits, replaceVisits } from "@/features/visits/actions";
import { MAX_VISITS } from "@/features/visits/schemas";
import type { Place } from "@/lib/maps/geocoding";
import { createClient } from "@/lib/supabase/client";

type NewPhoto = { kind: "new"; id: string; file: File; previewUrl: string };
type SavedPhoto = { kind: "saved"; id: string; path: string; previewUrl: string };
type ComposerPhoto = NewPhoto | SavedPhoto;

/** An existing trip to edit. Without one, the composer creates a trip. */
export type TripComposerTrip = {
  id: string;
  /** Storage folder new photos are uploaded into. */
  photoFolder: string;
  title: string;
  startDate: string;
  endDate: string;
  message: string;
  visibility: TripVisibility;
  places: Place[];
  photos: { id: string; path: string; url: string; isCover: boolean }[];
};

/**
 * What a new trip has saved so far. A retry resumes from here, so it never
 * creates a second trip or attaches photos twice.
 */
type NewTripProgress = {
  tripId: string;
  photoFolder: string;
  visitsSaved: boolean;
  photosSaved: boolean;
};

type TripDetailsInput = {
  title: string;
  startDate: string;
  endDate: string;
  message: string;
  visibility: TripVisibility;
};

export function TripComposer({ trip }: { trip?: TripComposerTrip }) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const isEditing = trip !== undefined;

  const [title, setTitle] = useState(trip?.title ?? "");
  const [dates, setDates] = useState({
    startDate: trip?.startDate ?? "",
    endDate: trip?.endDate ?? "",
  });
  const [message, setMessage] = useState(trip?.message ?? "");
  const [visibility, setVisibility] = useState<TripVisibility>(
    trip?.visibility ?? "public",
  );
  const [places, setPlaces] = useState<Place[]>(trip?.places ?? []);
  const [placesChanged, setPlacesChanged] = useState(false);
  const [photos, setPhotos] = useState<ComposerPhoto[]>(
    () =>
      trip?.photos.map((photo) => ({
        kind: "saved",
        id: photo.id,
        path: photo.path,
        previewUrl: photo.url,
      })) ?? [],
  );
  const [chosenCoverId, setChosenCoverId] = useState<string | null>(
    trip?.photos.find((photo) => photo.isCover)?.id ?? null,
  );

  const [fieldErrors, setFieldErrors] = useState<TripDetailsFieldErrors>({});
  const [placeNotice, setPlaceNotice] = useState<string | null>(null);
  const [photoProblems, setPhotoProblems] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const progress = useRef<NewTripProgress | null>(null);
  /** Photo id → storage path, for new photos already uploaded. */
  const uploaded = useRef(new Map<string, string>());
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [visitsSaved, setVisitsSaved] = useState(false);
  const [photosSaved, setPhotosSaved] = useState(false);

  const coverId =
    photos.find((photo) => photo.id === chosenCoverId)?.id ?? photos[0]?.id ?? null;
  const coverUrl = photos.find((photo) => photo.id === coverId)?.previewUrl ?? null;

  const points = useMemo<MapPoint[]>(
    () =>
      places.map((place) => ({
        id: place.providerId,
        lng: place.lng,
        lat: place.lat,
        label: place.label,
      })),
    [places],
  );

  // Release thumbnail object URLs when leaving the page.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () =>
      photosRef.current.forEach((p) => {
        if (p.kind === "new") URL.revokeObjectURL(p.previewUrl);
      }),
    [],
  );

  // ---- Places ---------------------------------------------------------------

  function addPlace(place: Place) {
    setPlaceNotice(null);
    if (places.some((p) => p.providerId === place.providerId)) {
      setPlaceNotice(`${place.name} is already on this trip.`);
      return;
    }
    if (places.length >= MAX_VISITS) {
      setPlaceNotice(`A trip can have up to ${MAX_VISITS} places.`);
      return;
    }
    setPlaces([...places, place]);
    setPlacesChanged(true);
  }

  function movePlace(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= places.length) return;
    const next = [...places];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setPlaces(next);
    setPlacesChanged(true);
  }

  function removePlace(index: number) {
    setPlaceNotice(null);
    setPlaces(places.filter((_, i) => i !== index));
    setPlacesChanged(true);
  }

  // ---- Photos ---------------------------------------------------------------

  function addPhotos(files: File[]) {
    const { accepted, problems } = selectPhotoFiles(files, photos.length);
    setPhotoProblems(problems);
    if (accepted.length === 0) return;
    setPhotos([
      ...photos,
      ...accepted.map((file) => ({
        kind: "new" as const,
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePhoto(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (photo?.kind === "new") URL.revokeObjectURL(photo.previewUrl);
    setPhotos(photos.filter((p) => p.id !== id));
    setPhotoProblems([]);
  }

  // ---- Save -----------------------------------------------------------------

  function focusFirstInvalidField() {
    requestAnimationFrame(() => {
      container.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }

  /** Where a photo lives in Storage, once it is there. */
  function photoPath(photo: ComposerPhoto): string | undefined {
    return photo.kind === "saved" ? photo.path : uploaded.current.get(photo.id);
  }

  /**
   * Resizes new photos in the browser and uploads them straight to Storage.
   * Returns how many are still not uploaded.
   */
  async function uploadNewPhotos(folder: string): Promise<number> {
    const newPhotos = photos.filter((p): p is NewPhoto => p.kind === "new");
    const pending = newPhotos.filter((p) => !uploaded.current.has(p.id));
    if (pending.length === 0) return 0;

    const supabase = createClient();
    let done = newPhotos.length - pending.length;
    setStatus(`Uploading photos ${done}/${newPhotos.length}…`);

    await Promise.all(
      pending.map(async (photo) => {
        try {
          const { blob, extension } = await prepareImageForUpload(photo.file);
          const path = buildTripPhotoPath(folder, crypto.randomUUID(), extension);
          const { error } = await supabase.storage
            .from(TRIP_PHOTOS_BUCKET)
            .upload(path, blob, { contentType: blob.type, upsert: false });
          if (error) throw error;
          uploaded.current.set(photo.id, path);
        } catch {
          // Counted below from what is still missing.
        } finally {
          setStatus(`Uploading photos ${++done}/${newPhotos.length}…`);
        }
      }),
    );

    return pending.filter((p) => !uploaded.current.has(p.id)).length;
  }

  function photoList() {
    return photos.map((photo) => ({
      path: photoPath(photo)!,
      isCover: photo.id === coverId,
    }));
  }

  /** Creates the trip, then its places and photos. Returns its id when done. */
  async function saveNewTrip(input: TripDetailsInput): Promise<string | null> {
    // 1. The trip itself.
    if (!progress.current) {
      setStatus("Saving trip…");
      const result = await createTrip(input);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setSaveError(result.error);
        focusFirstInvalidField();
        return null;
      }
      progress.current = {
        tripId: result.tripId,
        photoFolder: result.photoFolder,
        visitsSaved: false,
        photosSaved: false,
      };
      setSavedTripId(result.tripId);
    }
    const saved = progress.current;
    const failures: string[] = [];

    // 2. Places.
    if (!saved.visitsSaved) {
      setStatus("Saving places…");
      const result = await addVisits(saved.tripId, places);
      if (result.ok) {
        saved.visitsSaved = true;
        setVisitsSaved(true);
      } else {
        failures.push("the places");
      }
    }

    // 3. Photos, recorded once all of them are in Storage.
    if (!saved.photosSaved) {
      const failedUploads = await uploadNewPhotos(saved.photoFolder);
      if (failedUploads > 0) {
        failures.push(failedUploads === 1 ? "1 photo" : `${failedUploads} photos`);
      } else if (photos.length > 0) {
        setStatus("Saving photos…");
        const result = await attachTripPhotos(saved.tripId, photoList());
        if (result.ok) {
          saved.photosSaved = true;
          setPhotosSaved(true);
        } else {
          failures.push("the photos");
        }
      }
    }

    if (failures.length > 0) {
      setSaveError(
        `Your trip is saved, but ${failures.join(" and ")} didn't save. Try again, or remove the photos that failed.`,
      );
      return null;
    }
    return saved.tripId;
  }

  /** Saves edits to an existing trip. Returns its id when done. */
  async function saveChanges(
    current: TripComposerTrip,
    input: TripDetailsInput,
  ): Promise<string | null> {
    // 1. New photos go to Storage first, so the photo list can point at them.
    const failedUploads = await uploadNewPhotos(current.photoFolder);
    if (failedUploads > 0) {
      setSaveError(
        `${failedUploads === 1 ? "1 photo" : `${failedUploads} photos`} didn't upload, so nothing was saved yet. Try again, or remove the photos that failed.`,
      );
      return null;
    }

    // 2. Details and photos, together.
    setStatus("Saving changes…");
    const result = await updateTrip(current.id, input, photoList());
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setSaveError(result.error);
      focusFirstInvalidField();
      return null;
    }

    // 3. Places, only when they changed.
    if (placesChanged) {
      setStatus("Saving places…");
      const visitsResult = await replaceVisits(current.id, places);
      if (!visitsResult.ok) {
        setSaveError("Your other changes are saved, but the places didn't save. Try again.");
        return null;
      }
      setPlacesChanged(false);
    }
    return current.id;
  }

  function save() {
    setSaveError(null);
    const input = { title, ...dates, message, visibility };

    // A new trip's details are locked once it exists, so only check them
    // before then.
    if (isEditing || !progress.current) {
      const parsed = tripDetailsSchema.safeParse(input);
      if (!parsed.success) {
        setFieldErrors(z.flattenError(parsed.error).fieldErrors);
        focusFirstInvalidField();
        return;
      }
    }
    setFieldErrors({});

    startTransition(async () => {
      try {
        const tripId = trip
          ? await saveChanges(trip, input)
          : await saveNewTrip(input);
        if (!tripId) return;

        setStatus(isEditing ? "Changes saved!" : "Trip saved!");
        router.push(`/trips/${tripId}`);
      } catch {
        setSaveError("Something went wrong. Check your connection and try again.");
      } finally {
        setStatus((current) => (current?.endsWith("saved!") ? current : null));
      }
    });
  }

  const detailsLocked = isPending || (!isEditing && savedTripId !== null);
  const placesLocked = isPending || (!isEditing && visitsSaved);
  const photosLocked = isPending || (!isEditing && photosSaved);

  return (
    <div
      ref={container}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
    >
      {/* Form */}
      <section aria-label="Trip details" className="flex flex-col gap-7 lg:col-start-1">
        <TripTitleField
          value={title}
          onChange={setTitle}
          errors={fieldErrors.title}
          disabled={detailsLocked}
        />

        <TripDatesFields
          startDate={dates.startDate}
          endDate={dates.endDate}
          onChange={setDates}
          errors={fieldErrors}
          disabled={detailsLocked}
        />

        <div className="flex flex-col gap-3">
          <PlaceSearch onSelect={addPlace} disabled={placesLocked} />
          {placeNotice ? (
            <p role="status" className="text-sm">
              {placeNotice}
            </p>
          ) : null}

          {places.length > 0 ? (
            <ol className="flex flex-col gap-1.5" aria-label="Places, in order">
              {places.map((place, index) => (
                <li
                  key={place.providerId}
                  className="flex items-center gap-2 rounded-lg border bg-card py-1.5 pr-1.5 pl-2"
                >
                  <span
                    aria-hidden
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-foreground text-xs font-bold"
                  >
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{place.name}</span>
                    <span className="truncate text-xs">{place.label}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => movePlace(index, -1)}
                    disabled={placesLocked || index === 0}
                    aria-label={`Move ${place.name} earlier`}
                  >
                    <ArrowUpIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => movePlace(index, 1)}
                    disabled={placesLocked || index === places.length - 1}
                    aria-label={`Move ${place.name} later`}
                  >
                    <ArrowDownIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removePlace(index)}
                    disabled={placesLocked}
                    aria-label={`Remove ${place.name}`}
                  >
                    <XIcon aria-hidden />
                  </Button>
                </li>
              ))}
            </ol>
          ) : null}

          <div className="h-56 overflow-hidden rounded-xl border sm:h-64">
            {points.length > 0 ? (
              <TripsMapLazy
                points={points}
                label={`Map of ${points.length} ${points.length === 1 ? "place" : "places"}`}
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted p-6 text-center">
                <MapIcon aria-hidden className="size-7" strokeWidth={1.5} />
                <p className="text-sm">Add places and they&apos;ll show up here, in order.</p>
              </div>
            )}
          </div>
        </div>

        <PhotoPicker
          photos={photos}
          coverId={coverId}
          onAdd={addPhotos}
          onRemove={removePhoto}
          onSetCover={setChosenCoverId}
          problems={photoProblems}
          disabled={photosLocked}
        />

        <TripMessageField
          value={message}
          onChange={setMessage}
          errors={fieldErrors.message}
          disabled={detailsLocked}
        />

        <TripVisibilityField
          value={visibility}
          onChange={setVisibility}
          disabled={detailsLocked}
        />
      </section>

      {/* Live preview */}
      <aside
        aria-label="Postcard preview"
        className="flex flex-col gap-2 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
      >
        <p className="text-xs font-medium tracking-wide uppercase">Preview</p>
        <TripPreviewCard
          title={title}
          startDate={dates.startDate}
          endDate={dates.endDate}
          placeNames={places.map((place) => place.name)}
          message={message}
          visibility={visibility}
          coverUrl={coverUrl}
        />
      </aside>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t pt-6 lg:col-start-1">
        {saveError ? (
          <p role="alert" className="text-sm text-destructive">
            {saveError}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="lg" onClick={save} disabled={isPending}>
            {isPending ? (
              <LoaderCircleIcon aria-hidden className="animate-spin" />
            ) : null}
            {isEditing ? "Save changes" : savedTripId ? "Try again" : "Save trip"}
          </Button>
          {trip ? (
            <Link
              href={`/trips/${trip.id}`}
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Cancel
            </Link>
          ) : savedTripId && !isPending ? (
            <Link
              href={`/trips/${savedTripId}`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Skip and view trip
            </Link>
          ) : (
            <Link
              href="/trips"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Cancel
            </Link>
          )}
          <p role="status" aria-live="polite" className="text-sm">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
