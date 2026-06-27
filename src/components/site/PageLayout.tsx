import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { WhatsAppFab } from "./WhatsAppFab";

export function PageLayout({ children, waMessage }: { children: ReactNode; waMessage?: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <WhatsAppFab message={waMessage} />
    </div>
  );
}
