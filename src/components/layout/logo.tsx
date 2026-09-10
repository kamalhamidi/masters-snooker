import Image from "next/image";
import Link from "next/link";
import clubLogo from "../../../public/logo masters.png";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  size = "sm",
}: {
  className?: string;
  href?: string;
  size?: "sm" | "lg";
}) {
  return (
    <Link
      href={href}
      aria-label="CueHub home"
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-lg",
        className,
      )}
    >
      <Image
        src={clubLogo}
        alt="CueHub — Play, compete, connect"
        sizes={size === "lg" ? "216px" : "(min-width: 640px) 168px, 96px"}
        className={cn(
          "object-contain",
          size === "lg" ? "h-auto w-[216px]" : "h-auto w-[96px] sm:w-[168px]",
        )}
      />
    </Link>
  );
}
