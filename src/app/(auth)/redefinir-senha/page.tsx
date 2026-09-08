import { RedefinirSenhaForm } from "@/components/auth/RedefinirSenhaForm";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return <RedefinirSenhaForm token={token} />;
}
