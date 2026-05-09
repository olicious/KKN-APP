import KatalogToko from '@/components/KatalogToko';

// Params sekarang adalah Promise di Next.js terbaru
export default async function HalamanToko({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Tunggu (await) params terbuka dulu
  const resolvedParams = await params;
  const storeId = resolvedParams.id;

  return <KatalogToko storeId={storeId} />;
}
