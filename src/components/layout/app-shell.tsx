import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Bell,
  Building2,
  ChevronLeft,
  FileText,
  Gauge,
  HardHat,
  LineChart,
  LogOut,
  Menu,
  PanelLeftClose,
  Receipt,
  Search,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { LogoLockup, LogoMark } from "@/components/brand/logo";
import { AssistantFab } from "@/components/assistant/assistant-fab";
import { CommandPalette } from "@/components/layout/command-palette";
import { FieldLines } from "@/components/layout/field-lines";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/app-store";
import type { Period } from "@/data/selectors";

const NAV = [
  {
    group: "Principal",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: Gauge },
      { to: "/transactions", label: "Transactions", icon: Receipt },
      { to: "/exploitations", label: "Exploitations", icon: Building2 },
      { to: "/finance", label: "Finance", icon: LineChart },
    ],
  },
  {
    group: "Relations",
    items: [
      { to: "/fournisseurs", label: "Fournisseurs", icon: Truck },
      { to: "/ouvriers", label: "Ouvriers", icon: HardHat },
      { to: "/clients", label: "Clients", icon: Users },
    ],
  },
  {
    group: "Opérations",
    items: [
      { to: "/flux-internes", label: "Flux internes", icon: ArrowLeftRight },
      { to: "/documents", label: "Documents", icon: FileText },
      { to: "/rapports", label: "Rapports", icon: LineChart },
    ],
  },
  {
    group: "Configuration",
    items: [{ to: "/parametres", label: "Paramètres", icon: Settings }],
  },
] as const;

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/transactions": "Transactions",
  "/exploitations": "Exploitations",
  "/finance": "Finance",
  "/fournisseurs": "Fournisseurs",
  "/ouvriers": "Ouvriers",
  "/clients": "Clients",
  "/flux-internes": "Flux internes",
  "/documents": "Documents",
  "/rapports": "Rapports",
  "/parametres": "Paramètres",
};

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "year", label: "Cette année" },
  { value: "all", label: "Tout l'historique" },
];

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="space-y-6">
      {NAV.map((section) => (
        <div key={section.group}>
          {!collapsed ? (
            <div className="px-3 pb-2 text-[0.62rem] font-semibold tracking-[0.22em] text-sidebar-foreground/45 uppercase">
              {section.group}
            </div>
          ) : (
            <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
          )}
          <div className="space-y-1">
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-sidebar-primary)]",
                }}
                inactiveProps={{ className: "text-sidebar-foreground/72 hover:bg-sidebar-accent/60" }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-0",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function ProfileBlock({ collapsed }: { collapsed: boolean }) {
  const { logout } = useStore();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate({ to: "/connexion" });
  };

  if (collapsed)
    return (
      <button
        onClick={doLogout}
        title="Se déconnecter"
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );

  return (
    <div className="rounded-2xl bg-sidebar-accent/60 p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-sidebar-border">
          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
            DJ
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-sidebar-accent-foreground">Direction</div>
          <div className="truncate text-[0.7rem] text-sidebar-foreground/60">
            direction@domainejalal.ma
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={doLogout}
        className="mt-3 w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-4 w-4" /> Se déconnecter
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data, now, farmScope, setFarmScope, period, setPeriod, authed, ready, markNotificationRead, markAllNotificationsRead, logout } =
    useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !authed) navigate({ to: "/connexion" });
  }, [ready, authed, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unread = data.notifications.filter((n) => !n.read).length;
  const segments = pathname.split("/").filter(Boolean);
  const baseTitle = PAGE_TITLES[`/${segments[0] ?? ""}`] ?? "Domaine Jalal";
  const detailFarm = segments[0] === "exploitations" && segments[1]
    ? data.farms.find((f) => f.slug === segments[1])
    : undefined;
  const title = detailFarm ? detailFarm.name : baseTitle;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative min-h-screen bg-background">
        <FieldLines className="fixed inset-0 text-primary" />

        <div className="relative flex min-h-screen">
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "sticky top-0 hidden h-screen shrink-0 flex-col justify-between bg-sidebar px-3 py-5 transition-[width] duration-300 lg:flex",
              collapsed ? "w-[76px]" : "w-[266px]",
            )}
          >
            <div className="min-h-0 flex-1">
              <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
                {collapsed ? <LogoMark className="h-8 w-8" /> : <LogoLockup tone="dark" />}
              </div>
              <ScrollArea className="h-[calc(100vh-230px)] pr-1">
                <NavLinks collapsed={collapsed} />
              </ScrollArea>
            </div>
            <div className="space-y-3">
              <ProfileBlock collapsed={collapsed} />
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border py-2 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent"
              >
                {collapsed ? <ChevronLeft className="h-4 w-4 rotate-180" /> : <PanelLeftClose className="h-4 w-4" />}
                {!collapsed ? "Réduire" : null}
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-7">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir la navigation">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] bg-sidebar p-4">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <LogoLockup tone="dark" className="mb-6" />
                    <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
                    <div className="mt-6">
                      <ProfileBlock collapsed={false} />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                    <Link to="/dashboard" className="hover:text-primary">
                      Domaine Jalal
                    </Link>
                    <span>/</span>
                    <span className="truncate">{baseTitle}</span>
                    {detailFarm ? (
                      <>
                        <span>/</span>
                        <span className="truncate text-foreground">{detailFarm.name}</span>
                      </>
                    ) : null}
                  </div>
                  <h1 className="truncate font-display text-lg font-semibold tracking-tight">{title}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={farmScope} onValueChange={setFarmScope}>
                    <SelectTrigger className="hidden h-9 w-[186px] rounded-xl bg-card text-xs md:flex">
                      <SelectValue placeholder="Exploitation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les exploitations</SelectItem>
                      {data.farms.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                    <SelectTrigger className="hidden h-9 w-[140px] rounded-xl bg-card text-xs sm:flex">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <button
                    onClick={() => setPaletteOpen(true)}
                    className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden xl:inline">
                      Rechercher une transaction, un fournisseur, un ouvrier, un client...
                    </span>
                    <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[0.65rem] lg:inline">
                      Ctrl K
                    </kbd>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                        <Bell className="h-5 w-5" />
                        {unread > 0 ? (
                          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-primary-foreground num">
                            {unread}
                          </span>
                        ) : null}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[340px] p-0">
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[0.7rem] font-medium text-primary hover:underline"
                        >
                          Tout marquer comme lu
                        </button>
                      </div>
                      <DropdownMenuSeparator className="m-0" />
                      <ScrollArea className="h-[330px]">
                        {data.notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={cn(
                              "flex w-full gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-accent/60",
                              !n.read && "bg-accent/35",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                                n.read ? "bg-border" : "bg-primary",
                              )}
                            />
                            <span className="min-w-0">
                              <span className="block text-[0.8rem] font-semibold">{n.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">{n.detail}</span>
                              <span className="mt-0.5 block text-[0.66rem] text-muted-foreground/80">
                                {relativeTime(n.date, now)}
                              </span>
                            </span>
                          </button>
                        ))}
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 transition-colors hover:border-primary/40">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-canopy text-[0.65rem] font-semibold text-canopy-foreground">
                            DJ
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden text-xs font-semibold md:inline">Direction</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="text-sm">Direction du domaine</div>
                        <div className="text-[0.7rem] font-normal text-muted-foreground">
                          direction@domainejalal.ma
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => navigate({ to: "/parametres" })}>
                        <Settings className="h-4 w-4" /> Paramètres
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          logout();
                          navigate({ to: "/connexion" });
                        }}
                      >
                        <LogOut className="h-4 w-4" /> Se déconnecter
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            <main className="min-w-0 flex-1 px-4 py-6 lg:px-7 lg:py-8">{children}</main>
          </div>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <AssistantFab />
      </div>
    </TooltipProvider>
  );
}
