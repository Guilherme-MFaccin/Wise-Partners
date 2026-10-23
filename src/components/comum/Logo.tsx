import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <img src="/logo-wise-makers-clara.png" alt="Wise Makers" className={cn("h-7 w-auto", className)} />;
}
