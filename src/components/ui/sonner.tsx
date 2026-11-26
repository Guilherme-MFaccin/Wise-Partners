import { Toaster as Sonner } from "sonner";
import { useTemaAtual } from "@/lib/tema";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Avisos com o material dos elementos flutuantes, no tema que está valendo
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme={useTemaAtual()}
    className="toaster group"
    toastOptions={{
      classNames: {
        toast: "group toast group-[.toaster]:rounded-[14px] group-[.toaster]:bg-popover group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:sombra-flutuante",
        description: "group-[.toast]:text-muted-foreground",
        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
        cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
      },
    }}
    {...props}
  />
);

export { Toaster };
