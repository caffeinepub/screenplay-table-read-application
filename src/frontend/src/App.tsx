import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useState } from "react";

const ScreenplayUpload = lazy(() =>
  import("@/components/ScreenplayUpload").then((m) => ({
    default: m.ScreenplayUpload,
  })),
);
const ScreenplayPlayer = lazy(() =>
  import("@/components/ScreenplayPlayer").then((m) => ({
    default: m.ScreenplayPlayer,
  })),
);

function PageSkeleton() {
  return (
    <div className="flex-1 container mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function App() {
  const [selectedScreenplayId, setSelectedScreenplayId] = useState<
    string | null
  >(null);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<PageSkeleton />}>
            {selectedScreenplayId ? (
              <ScreenplayPlayer
                screenplayId={selectedScreenplayId}
                onBack={() => setSelectedScreenplayId(null)}
              />
            ) : (
              <ScreenplayUpload onScreenplaySelect={setSelectedScreenplayId} />
            )}
          </Suspense>
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
