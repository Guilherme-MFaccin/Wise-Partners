import { cn } from "@/lib/utils";

// Duas versões da marca: "Makers" em branco no escuro e em grafite no claro; o menta é o mesmo nas duas
export function Logo({ className }: { className?: string }) {
  return (
    <>
      <img src="/logo-wise-makers-escura.png" alt="Wise Makers" className={cn("h-7 w-auto dark:hidden", className)} />
      <img src="/logo-wise-makers-clara.png" alt="Wise Makers" className={cn("hidden h-7 w-auto dark:block", className)} />
    </>
  );
}
