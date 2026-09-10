import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SongCard } from '../../components/SongCard/index.ts';
import { Button } from '../../components/ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog.tsx';
import { useSongLibrary } from '../../hooks/useSongLibrary.ts';

export function SongLibraryPage() {
  const navigate = useNavigate();
  const { songs, loading, removeSong } = useSongLibrary();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await removeSong(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Song Library</h1>
        <Button onClick={() => navigate('/')}>Upload Song</Button>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-16">
          <p className="text-muted-foreground">No songs yet</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Upload your first song
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} onDelete={(id) => setDeleteId(id)} />
          ))}
        </div>
      )}

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Song</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this song and all associated data. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
