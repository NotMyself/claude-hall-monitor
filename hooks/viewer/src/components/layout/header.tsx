import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b bg-background px-2 md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      {title && <h2 className="text-base md:text-lg font-semibold truncate">{title}</h2>}
      <div className="flex-1" />
    </header>
  );
}
