import { TreeWall } from "@/components/TreeParticipation";
export default async function Page({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  return <TreeWall session={session} />;
}
