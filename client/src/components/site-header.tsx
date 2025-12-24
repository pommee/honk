import { ModeToggle } from "./theme/theme-toggle";

export function SiteHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <h1 className="font-semibold text-foreground">Honk</h1>
      </div>

      <div className="flex items-center gap-2 px-4 lg:px-6">
        <ModeToggle />
      </div>
    </header>
  );
}
