import { Suspense } from "react";
import { ProviderDashboard } from "@/components/ProviderDashboard";

export const dynamic = "force-static";

export default function ProvidersPage() {
  return (
    <Suspense fallback={null}>
      <ProviderDashboard />
    </Suspense>
  );
}
