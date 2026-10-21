export default function EsqueletoGrafico({
  altura = 256,
}: {
  altura?: number;
}) {
  return (
    <div className="animate-pulse rounded-3xl bg-cream-dark p-6">
      <div className="h-5 w-40 rounded-full bg-ink/10" />
      <div className="mt-2 h-4 w-28 rounded-full bg-ink/10" />
      <div className="mt-4 rounded-2xl bg-ink/5" style={{ height: altura }} />
    </div>
  );
}
