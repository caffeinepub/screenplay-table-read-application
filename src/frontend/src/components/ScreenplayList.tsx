import type { ScreenplaySummary } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteScreenplay } from "@/hooks/useQueries";
import { FileText, Loader2, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ScreenplayListProps {
  screenplays: ScreenplaySummary[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}

export function ScreenplayList({
  screenplays,
  isLoading,
  onSelect,
}: ScreenplayListProps) {
  const deleteScreenplay = useDeleteScreenplay();

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteScreenplay.mutateAsync(id);
      toast.success(`"${title}" deleted`);
    } catch {
      toast.error("Failed to delete screenplay");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Your Screenplays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (screenplays.length === 0) return null;

  return (
    <Card data-ocid="screenplay-list">
      <CardHeader>
        <CardTitle className="font-display">Your Screenplays</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {screenplays.map((screenplay) => (
          <div
            key={screenplay.id}
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            data-ocid={`screenplay-row-${screenplay.id}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium truncate">{screenplay.title}</h3>
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {screenplay.language}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onSelect(screenplay.id)}
                data-ocid="play-screenplay"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Play
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(screenplay.id, screenplay.title)}
                disabled={deleteScreenplay.isPending}
                data-ocid="delete-screenplay"
              >
                {deleteScreenplay.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
