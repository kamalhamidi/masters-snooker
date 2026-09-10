import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Join the club") };
}

export default function RegisterPage() {
  return (
    <div className="felt-texture flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
