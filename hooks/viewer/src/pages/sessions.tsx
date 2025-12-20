import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionList, SessionDetail } from '@/components/sessions';
import { SessionListSkeleton, SessionDetailSkeleton, EmptyState } from '@/components/shared';
import { useSessions } from '@/hooks/use-sessions';
import type { Session } from '@/types/sessions';
import { Database } from 'lucide-react';

export function SessionsPage() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');

  const { sessions, loading, error } = useSessions();

  // Get unique models for filter dropdown
  const models = useMemo(() => {
    const uniqueModels = new Set(sessions.map(s => s.model));
    return ['all', ...Array.from(uniqueModels)];
  }, [sessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesSearch = session.project_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModel = modelFilter === 'all' || session.model === modelFilter;
      return matchesSearch && matchesModel;
    });
  }, [sessions, searchQuery, modelFilter]);

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          <div className="md:col-span-1">
            <SessionListSkeleton />
          </div>
          <div className="md:col-span-2">
            <SessionDetailSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <EmptyState
          icon={<Database className="h-12 w-12" />}
          title="Failed to load sessions"
          description={error.message}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 md:gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={modelFilter} onValueChange={setModelFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by model" />
          </SelectTrigger>
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model} value={model}>
                {model === 'all' ? 'All Models' : model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Split panel */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        <div className="md:col-span-1">
          {sessions.length === 0 ? (
            <EmptyState
              icon={<Database className="h-12 w-12" />}
              title="No sessions found"
              description="No Claude sessions have been recorded yet. Start a conversation to see sessions appear here."
            />
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              icon={<Database className="h-12 w-12" />}
              title="No matching sessions"
              description="Try adjusting your search or filter criteria"
            />
          ) : (
            <SessionList
              sessions={filteredSessions}
              selectedSessionId={selectedSession?.session_id ?? null}
              onSelect={setSelectedSession}
              loading={loading}
            />
          )}
        </div>
        <div className="md:col-span-2">
          {selectedSession ? (
            <SessionDetail session={selectedSession} />
          ) : (
            <EmptyState
              icon={<Database className="h-12 w-12" />}
              title="Select a session"
              description="Choose a session from the list to view its metrics and details"
            />
          )}
        </div>
      </div>
    </div>
  );
}
