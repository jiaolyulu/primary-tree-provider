import { Suspense } from "react";
import { InsuranceCard } from "@/components/InsuranceCard";

export const dynamic = "force-static";

export default function CardPage() {
  return (
    <Suspense fallback={null}>
      <InsuranceCard />
    </Suspense>
  );
}
