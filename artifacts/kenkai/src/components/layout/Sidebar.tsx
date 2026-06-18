import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ClipboardList, 
  MessageSquare, 
  FileText, 
  LogOut,
  Sparkles,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/ai", label: "KENKAI AI", icon: Bot, highlight: true },
    { href: "/assessments", label: "Đánh giá", icon: ClipboardList },
    { href: "/sessions", label: "Phiên tư vấn", icon: MessageSquare },
    { href: "/reports", label: "Báo cáo", icon: FileText },
  ];

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg tracking-tight">KENKAI</span>
      </div>
      
      <div className="flex-1 py-6 flex flex-col gap-1 px-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu</div>
        {links.map((link) => {
          const isActive = location.startsWith(link.href);
          const Icon = link.icon;
          const isHighlight = "highlight" in link && link.highlight;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : isHighlight
                    ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
                {isHighlight && !isActive && (
                  <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">AI</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-sidebar-border/50">
        <Link href="/">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </div>
        </Link>
      </div>
    </div>
  );
}
