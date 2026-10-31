"use client";

import { GlobeIcon, LockIcon } from "lucide-react";
import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { MESSAGE_MAX, TITLE_MAX, type TripVisibility } from "../schemas";

export function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {messages[0]}
    </p>
  );
}

export function TripTitleField({
  value,
  onChange,
  errors,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
  disabled?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Title</Label>
      <Input
        id={id}
        name="title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Lisbon long weekend"
        maxLength={TITLE_MAX}
        autoComplete="off"
        required
        disabled={disabled}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? errorId : undefined}
        className="h-10 text-base md:text-base"
      />
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}

export function TripDatesFields({
  startDate,
  endDate,
  onChange,
  errors,
  disabled,
}: {
  startDate: string;
  endDate: string;
  onChange: (dates: { startDate: string; endDate: string }) => void;
  errors?: { startDate?: string[]; endDate?: string[] };
  disabled?: boolean;
}) {
  const id = useId();
  const startId = `${id}-start`;
  const endId = `${id}-end`;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm leading-none font-medium">When</legend>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={startId} className="font-normal">
            From
          </Label>
          <Input
            id={startId}
            type="date"
            name="startDate"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => {
              const next = event.target.value;
              // Keep the range valid: move the end along when it falls behind.
              onChange({
                startDate: next,
                endDate: !endDate || (next && endDate < next) ? next : endDate,
              });
            }}
            required
            disabled={disabled}
            aria-invalid={errors?.startDate?.length ? true : undefined}
            aria-describedby={errors?.startDate?.length ? `${startId}-error` : undefined}
          />
          <FieldError id={`${startId}-error`} messages={errors?.startDate} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={endId} className="font-normal">
            To
          </Label>
          <Input
            id={endId}
            type="date"
            name="endDate"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) =>
              onChange({ startDate, endDate: event.target.value })
            }
            required
            disabled={disabled}
            aria-invalid={errors?.endDate?.length ? true : undefined}
            aria-describedby={errors?.endDate?.length ? `${endId}-error` : undefined}
          />
          <FieldError id={`${endId}-error`} messages={errors?.endDate} />
        </div>
      </div>
    </fieldset>
  );
}

export function TripMessageField({
  value,
  onChange,
  errors,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
  disabled?: boolean;
}) {
  const id = useId();
  const counterId = `${id}-counter`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>Message</Label>
        <span id={counterId} className="text-xs tabular-nums">
          {value.length}/{MESSAGE_MAX}
        </span>
      </div>
      <Textarea
        id={id}
        name="message"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="The pastéis were worth the queue…"
        maxLength={MESSAGE_MAX}
        rows={3}
        disabled={disabled}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={[counterId, errors?.length ? errorId : null]
          .filter(Boolean)
          .join(" ")}
        className="min-h-24 resize-none"
      />
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}

export function TripVisibilityField({
  value,
  onChange,
  disabled,
}: {
  value: TripVisibility;
  onChange: (value: TripVisibility) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const isPublic = value === "public";
  const Icon = isPublic ? GlobeIcon : LockIcon;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
        <div className="flex flex-col gap-1">
          <Label htmlFor={id}>{isPublic ? "Public" : "Private"}</Label>
          <p id={descriptionId} className="text-sm">
            {isPublic
              ? "Anyone with the link can see this trip, including its photos."
              : "Only you can see this trip."}
          </p>
        </div>
      </div>
      <Switch
        id={id}
        checked={isPublic}
        onCheckedChange={(checked) => onChange(checked ? "public" : "private")}
        disabled={disabled}
        aria-describedby={descriptionId}
        className="mt-0.5"
      />
    </div>
  );
}
