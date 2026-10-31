import Link from "next/link";

export default function TripNotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm">This trip doesn&apos;t exist or isn&apos;t yours.</p>
      <Link href="/trips" className="text-sm underline underline-offset-4">
        Back to trips
      </Link>
    </div>
  );
}
