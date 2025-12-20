import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { type Session } from '@/types/sessions';
import { formatDuration, formatRelativeTime, formatCost, cn } from '@/lib/utils';

interface SessionListProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelect: (session: Session) => void;
  loading?: boolean;
}

const ITEM_HEIGHT = 100;
const OVERSCAN = 3;

export function SessionList({ sessions, selectedSessionId, onSelect, loading = false }: SessionListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const updateHeight = () => {
      if (scrollRef.current) {
        setContainerHeight(scrollRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          No sessions found
        </div>
      </Card>
    );
  }

  // Virtual scrolling calculations
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    sessions.length - 1,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  const visibleSessions = sessions.slice(startIndex, endIndex + 1);
  const totalHeight = sessions.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <ScrollArea
      className="h-full"
      ref={scrollRef}
      onScroll={handleScroll as any}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleSessions.map((session) => (
            <Card
              key={session.session_id}
              className={cn(
                "p-4 mb-2 cursor-pointer transition-colors hover:bg-accent",
                selectedSessionId === session.session_id && "ring-2 ring-[#D4A27F]"
              )}
              onClick={() => onSelect(session)}
              style={{ height: `${ITEM_HEIGHT - 8}px` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm md:text-base font-medium truncate flex-1" title={session.project_name}>
                  {session.project_name}
                </div>
                <Badge variant="outline" className="ml-2 shrink-0">
                  {session.model}
                </Badge>
              </div>

              <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mb-1 flex-wrap">
                <span>{formatDuration(session.duration)}</span>
                <span>{formatCost(session.cost_usd)}</span>
              </div>

              <div className="text-xs text-muted-foreground">
                {formatRelativeTime(session.started_at)}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
