import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";
import { useHealthCheck } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: health } = useHealthCheck();

  return (
    <div className="flex min-h-screen w-full bg-background dark text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {health?.status !== "ok" && health !== undefined && (
           <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 text-center border-b border-destructive/20">
             Warning: API server is disconnected or unhealthy.
           </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
