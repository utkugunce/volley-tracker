import { redirect } from "next/navigation";
import { slugify } from "@/utils/slugify";

interface PageProps {
  params: Promise<{ city: string }>;
}

export default async function CityGroupStatusRedirect({ params }: PageProps) {
  const { city } = await params;
  const citySlug = slugify(city);
  redirect(`/grup-durumu/${citySlug}`);
}
