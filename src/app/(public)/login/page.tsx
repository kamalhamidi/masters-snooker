import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="felt-texture flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
