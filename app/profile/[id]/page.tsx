import { redirect } from "next/navigation";

/** All member profiles use the current unified profile experience. */
export default async function LegacyMemberProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/profile?section=muslimeen&member=${encodeURIComponent(id)}`);
}
