import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Join the club" };

export default function RegisterPage() {
  return (
    <div className="felt-texture flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
