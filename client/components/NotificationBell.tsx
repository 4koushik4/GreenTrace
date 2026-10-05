import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase, useAuth } from "@/lib/supabase";

type AppNotification = {
  id: string;
  title: string;
  message: string;
  entity_type: "pickup" | "issue";
  entity_id: string;
  read_at: string | null;
  created_at: string;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const staff = user?.email?.toLowerCase() === "staff@gt.com";

  const refresh = useCallback(async () => {
    if (!supabase || !user) { setItems([]); return; }
    let query = supabase.from("notifications").select("id,title,message,entity_type,entity_id,read_at,created_at").order("created_at", { ascending: false }).limit(20);
    query = staff ? query.eq("audience", "staff") : query.eq("recipient_id", user.id).eq("audience", "user");
    const { data, error } = await query;
    if (!error) setItems((data ?? []) as AppNotification[]);
  }, [user?.id, staff]);

  useEffect(() => {
    void refresh();
    if (!supabase || !user) return;
    const channel = supabase.channel(`notifications-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => { void refresh(); })
      .subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [refresh, user?.id]);

  const markRead = async (item: AppNotification) => {
    if (!item.read_at && supabase) {
      const readAt = new Date().toISOString();
      const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", item.id);
      if (!error) setItems((current) => current.map((n) => n.id === item.id ? { ...n, read_at: readAt } : n));
    }
  };

  const unread = items.filter((item) => !item.read_at).length;
  const linkFor = (item: AppNotification) => staff
    ? "/admin/supervisor"
    : item.entity_type === "pickup" ? "/pickups" : "/report";

  return <div className="relative">
    <Button aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} variant="ghost" size="icon" className="relative" onClick={() => setOpen((value) => !value)}>
      <Bell className="h-5 w-5" />
      {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">{unread > 9 ? "9+" : unread}</span>}
    </Button>
    {open && <div className="absolute right-0 z-[60] mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-900 p-3 text-white shadow-2xl">
      <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Notifications</h2><span className="text-xs text-slate-400">{unread} unread</span></div>
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {items.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">You’re all caught up.</p> : items.map((item) => <Link key={item.id} to={linkFor(item)} onClick={() => { void markRead(item); setOpen(false); }} className={`block rounded-lg border p-3 hover:bg-slate-800 ${item.read_at ? "border-slate-800" : "border-emerald-500/40 bg-emerald-950/20"}`}>
          <div className="flex items-start justify-between gap-2"><span className="text-sm font-medium">{item.title}</span>{!item.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />}</div>
          <p className="mt-1 text-xs text-slate-300">{item.message}</p>
          <time className="mt-2 block text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</time>
        </Link>)}
      </div>
    </div>}
  </div>;
}
