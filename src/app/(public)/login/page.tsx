import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Log in") };
}

export default function LoginPage() {
  return (
    <div className="felt-texture flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
