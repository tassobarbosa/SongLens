import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { UploadPage } from './pages/UploadPage/index.ts';
import { SongViewerPage } from './pages/SongViewerPage/index.ts';
import { SongLibraryPage } from './pages/SongLibraryPage/index.ts';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-page py-3">
            <Link to="/" className="text-xl font-bold text-primary">
              SongLens
            </Link>
            <div className="flex gap-4">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Upload
              </Link>
              <Link to="/songs" className="text-sm text-muted-foreground hover:text-foreground">
                Library
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-page py-section">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/song/:id" element={<SongViewerPage />} />
            <Route path="/songs" element={<SongLibraryPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
