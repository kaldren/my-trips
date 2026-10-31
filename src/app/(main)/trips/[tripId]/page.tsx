export default async function TripPage({
  params,
}: PageProps<"/trips/[tripId]">) {
  const { tripId } = await params;

  return <h1 className="text-2xl font-semibold">Trip {tripId}</h1>;
}
