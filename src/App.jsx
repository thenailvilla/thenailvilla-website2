import { useState, useEffect } from "react";

const SERVICES = [
  { id: 1, name: "Nail Extensions", duration: 120, price: 2500, icon: "💅" },
  { id: 2, name: "Extensions Removal", duration: 30, price: 500, icon: "✨" },
  { id: 3, name: "Gel Polish Removal", duration: 20, price: 300, icon: "🧴" },
  { id: 4, name: "Overlays", duration: 90, price: 1800, icon: "💎" },
  { id: 5, name: "Hand Gel Polish", duration: 60, price: 1200, icon: "🤚" },
  { id: 6, name: "Feet Gel Polish", duration: 60, price: 1200, icon: "🦶" },
];

const MAP_LINK = "https://maps.app.goo.gl/afo8uQNsUaKDxkqt8";
const sk = (k) => `nv3:${k}`;
const fmtDateNice = (d) => { const dt = new Date(d + "T00:00:00"); return `${dt.toLocaleDateString("en-IN", { weekday: "long" })} ${dt.getDate()} ${dt.toLocaleDateString("en-IN", { month: "long" })}, ${dt.getFullYear()}`; };
const fmtDateShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtTime = (t) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
const fmtDur = (m) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : m + "m";
const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };
const firstName = (name) => (name || "").trim().split(/\s+/)[0];

const getConfMsg = (b) => { const dur = b.services.reduce((s, sn) => s + (SERVICES.find(sv => sv.name === sn)?.duration || 0), 0); return `Hi ${firstName(b.name)}! Your appointment at *The Nail Villa* has been successfully booked!\n\n*Day & Date:* ${fmtDateNice(b.date)}\n*Time:* ${fmtTime(b.time)}\n*Service:* ${b.services.join(", ")}\n*Duration:* ${dur} mins\n\nKindly arrive on time so we can give you the best service.\n\nIf you need to reschedule, please inform us at least a few hours in advance.\n\nWe look forward to pampering you!\n\nThank you.\n${MAP_LINK}`; };
const getRemMsg = (b) => `Hi ${firstName(b.name)}!\n\nThis is a gentle reminder that you have an appointment at *The Nail Villa* today at *${fmtTime(b.time)}* for your *${b.services.join(", ")}*.\n\nKindly confirm if you'll be able to make it.\n\nLooking forward to seeing you! 💅`;
const getTyMsg = (b) => `Hi ${firstName(b.name)},\n\nThank you for visiting The Nail Villa 💅\nIt was a pleasure having you!\nHope you loved your nails—see you again soon 💖`;
const getBookAgainMsg = (c) => `Hi ${firstName(c.name)}!\n\nWe miss you at *The Nail Villa*! It's been a while since your last visit.\n\nWould you like to book your next appointment? We have some amazing new designs waiting for you! 💅✨\n\n${MAP_LINK}`;
const getBdayMsg = (c) => `Happy Birthday ${firstName(c.name)}! 🎂🌸\n\nWishing you a wonderful day from all of us at *The Nail Villa*! 💖\n\nAs a birthday treat, enjoy a special discount on your next visit! Come pamper yourself! 💅✨\n\n${MAP_LINK}`;

const openWA = (phone, msg) => { const num = phone.replace(/\D/g, ""); window.open(`https://wa.me/${num.length === 10 ? "91" + num : num}?text=${encodeURIComponent(msg)}`, "_blank"); };
const openCal = (b) => { const totalMin = b.services.reduce((s, sn) => s + (SERVICES.find(sv => sv.name === sn)?.duration || 60), 0); const start = new Date(`${b.date}T${b.time}:00`); const end = new Date(start.getTime() + totalMin * 60000); const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0]; window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Nail Villa - " + b.name)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(`Client: ${b.name}\nPhone: ${b.phone}\nServices: ${b.services.join(", ")}`)}&location=${encodeURIComponent("The Nail Villa, Pimpri-Chinchwad, Pune")}`, "_blank"); };

const INIT = { bookings: [], clients: [], expenses: [], waitlist: [], payments: [] };

export default function App() {
  const [tab, setTab] = useState("book");
  const [data, setData] = useState(INIT);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", services: [], notes: "", price: "" });
  const [editId, setEditId] = useState(null);
  const [filterDate, setFilterDate] = useState(todayStr());
  const [searchQ, setSearchQ] = useState("");
  const [clientView, setClientView] = useState(null);
  const [expForm, setExpForm] = useState({ item: "", amount: "", date: todayStr(), category: "supplies" });
  const [promoMsg, setPromoMsg] = useState("");
  const [dashPeriod, setDashPeriod] = useState("week");
  const [subTab, setSubTab] = useState("");
  const [waitForm, setWaitForm] = useState({ name: "", phone: "", service: "", notes: "" });
  const [payForm, setPayForm] = useState({ bookingId: "", amount: "", method: "cash", notes: "" });
  const [payMonth, setPayMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`; });
  const [payDay, setPayDay] = useState(todayStr());
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showCalLink, setShowCalLink] = useState("");
  const [showWaLink, setShowWaLink] = useState("");

  useEffect(() => {
    try {
      const r = localStorage.getItem(sk("data"));
      if (r) setData({ ...INIT, ...JSON.parse(r) });
    } catch (e) {}
    setLoading(false);
  }, []);

  const saveToStorage = (nd) => { try { localStorage.setItem(sk("data"), JSON.stringify(nd)); } catch (e) {} };
  const save = (nd) => { setData(nd); saveToStorage(nd); };
  const flash = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const updateClient = (phone, name, serviceNames, price, date) => {
    const clients = [...data.clients]; const idx = clients.findIndex(c => c.phone === phone);
    if (idx >= 0) { clients[idx].visits = (clients[idx].visits || 0) + 1; clients[idx].totalSpent = (clients[idx].totalSpent || 0) + price; clients[idx].lastVisit = date; clients[idx].name = name; if (!clients[idx].serviceHistory) clients[idx].serviceHistory = []; clients[idx].serviceHistory.push({ services: serviceNames, date, price }); }
    else { clients.push({ phone, name, visits: 1, totalSpent: price, lastVisit: date, serviceHistory: [{ services: serviceNames, date, price }], birthday: "", notes: "", favColors: "", createdAt: new Date().toISOString() }); }
    return clients;
  };

  const toggleSvc = (svc) => setForm(f => ({ ...f, services: f.services.includes(svc.name) ? f.services.filter(s => s !== svc.name) : [...f.services, svc.name] }));
  const totalMin = form.services.reduce((s, sn) => s + (SERVICES.find(sv => sv.name === sn)?.duration || 0), 0);
  const autoPrice = form.services.reduce((s, sn) => s + (SERVICES.find(sv => sv.name === sn)?.price || 0), 0);

  const handleBook = () => {
    if (!form.name || !form.phone || !form.date || !form.time || form.services.length === 0) { flash("Fill all fields", "err"); return; }
    const price = autoPrice;
    if (editId) {
      const bookings = data.bookings.map(b => b.id === editId ? { ...b, name: form.name, phone: form.phone, date: form.date, time: form.time, services: form.services, notes: form.notes, price } : b);
      const nd = { ...data, bookings };
      save(nd); flash("Updated!"); setEditId(null);
    } else {
      const booking = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: form.name, phone: form.phone, date: form.date, time: form.time, services: form.services, notes: form.notes, price, status: "confirmed", reminderSent: false, createdAt: new Date().toISOString() };
      const clients = updateClient(form.phone, form.name, form.services, 0, form.date);
      const nd = { ...data, bookings: [...data.bookings, booking], clients };
      save(nd);

      const totalMins = booking.services.reduce((s, sn) => s + (SERVICES.find(sv => sv.name === sn)?.duration || 60), 0);
      const start = new Date(`${booking.date}T${booking.time}:00`);
      const end = new Date(start.getTime() + totalMins * 60000);
      const fmtCal = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0];
      const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Nail Villa - " + booking.name)}&dates=${fmtCal(start)}/${fmtCal(end)}&details=${encodeURIComponent(`Client: ${booking.name}\nPhone: ${booking.phone}\nServices: ${booking.services.join(", ")}`)}&location=${encodeURIComponent("The Nail Villa, Pimpri-Chinchwad, Pune")}`;

      const waNum = booking.phone.replace(/\D/g, "");
      const waFull = waNum.length === 10 ? "91" + waNum : waNum;
      const waUrl = `https://wa.me/${waFull}?text=${encodeURIComponent(getConfMsg(booking))}`;

      setShowCalLink(calUrl);
      setShowWaLink(waUrl);
      setShowLinksModal(true);
      flash("Booked successfully!");
    }
    setForm({ name: "", phone: "", date: "", time: "", services: [], notes: "", price: "" });
  };

  const completeBooking = (b) => {
    const clients = updateClient(b.phone, b.name, b.services, b.price, b.date);
    save({ ...data, bookings: data.bookings.map(x => x.id === b.id ? { ...x, status: "completed" } : x), clients });
    openWA(b.phone, getTyMsg(b)); flash("Done & thank you sent!");
  };

  const markStatus = (id, status) => { save({ ...data, bookings: data.bookings.map(b => b.id === id ? { ...b, status } : b) }); };
  const deleteBooking = (id) => { save({ ...data, bookings: data.bookings.filter(b => b.id !== id) }); flash("Deleted"); };
  const startEdit = (b) => { setForm({ name: b.name, phone: b.phone, date: b.date, time: b.time, services: [...b.services], notes: b.notes || "", price: b.price?.toString() || "" }); setEditId(b.id); setTab("book"); };
  const addExpense = () => { if (!expForm.item || !expForm.amount) { flash("Fill item & amount", "err"); return; } save({ ...data, expenses: [...data.expenses, { id: Date.now().toString(36), ...expForm, amount: parseInt(expForm.amount) }] }); setExpForm({ item: "", amount: "", date: todayStr(), category: "supplies" }); flash("Expense added!"); };
  const deleteExpense = (id) => { save({ ...data, expenses: data.expenses.filter(e => e.id !== id) }); };
  const updateClientField = (phone, field, value) => { const clients = data.clients.map(c => c.phone === phone ? { ...c, [field]: value } : c); save({ ...data, clients }); if (clientView) setClientView({ ...clientView, [field]: value }); flash("Saved!"); };
  const addWaitlist = () => { if (!waitForm.name || !waitForm.phone) { flash("Fill name & phone", "err"); return; } save({ ...data, waitlist: [...data.waitlist, { id: Date.now().toString(36), ...waitForm, addedAt: new Date().toISOString() }] }); setWaitForm({ name: "", phone: "", service: "", notes: "" }); flash("Added!"); };
  const removeWaitlist = (id) => { save({ ...data, waitlist: data.waitlist.filter(w => w.id !== id) }); };
  const addPayment = (bId, name, phone, services, amount, method, notes) => {
    const payment = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), bookingId: bId || "", name, phone: phone || "", services: services || [], amount: parseInt(amount), method, notes: notes || "", date: todayStr(), time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }), createdAt: new Date().toISOString() };
    save({ ...data, payments: [...data.payments, payment] });
    flash("Payment recorded!");
  };
  const deletePayment = (id) => { save({ ...data, payments: data.payments.filter(p => p.id !== id) }); flash("Payment deleted"); };
  const fillFromPhone = (phone) => { const c = data.clients.find(cl => cl.phone === phone); if (c) setForm(f => ({ ...f, name: c.name })); };

  const now = new Date();
  const periodStart = dashPeriod === "week" ? daysAgo(7) : dashPeriod === "month" ? daysAgo(30) : daysAgo(365);
  const periodBookings = data.bookings.filter(b => b.date >= periodStart && b.status === "completed");
  const periodRevenue = periodBookings.reduce((s, b) => s + (b.price || 0), 0);
  const periodExpenses = data.expenses.filter(e => e.date >= periodStart).reduce((s, e) => s + e.amount, 0);
  const svcCount = {}; periodBookings.forEach(b => b.services.forEach(s => { svcCount[s] = (svcCount[s] || 0) + 1; }));
  const topServices = Object.entries(svcCount).sort((a, b) => b[1] - a[1]);
  const dayCount = {}; periodBookings.forEach(b => { const day = new Date(b.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" }); dayCount[day] = (dayCount[day] || 0) + 1; });
  const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
  const upcomingReminders = data.bookings.filter(b => { if (b.status !== "confirmed" || b.reminderSent) return false; const hrs = (new Date(`${b.date}T${b.time}:00`) - now) / 3600000; return hrs > 0 && hrs <= 15; });
  const inactiveClients = data.clients.filter(c => c.lastVisit && (now - new Date(c.lastVisit + "T00:00:00")) / 86400000 >= 21);
  const todayBdays = data.clients.filter(c => { if (!c.birthday) return false; const [m, d] = c.birthday.split("-").slice(1); const t = todayStr().split("-"); return m === t[1] && d === t[2]; });
  const todayBookings = data.bookings.filter(b => b.date === todayStr() && b.status === "confirmed");
  const filteredBookings = data.bookings.filter(b => { if (searchQ) { const q = searchQ.toLowerCase(); return b.name.toLowerCase().includes(q) || b.phone.includes(q); } return b.date === filterDate; });

  const accent = "#C75B3F";
  const accentLight = "#FFF0EB";
  const accentDark = "#8B3A25";
  const rose = "#F9E8E4";
  const cream = "#FDF8F5";

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, fontFamily: "'Georgia', serif", color: accent, fontSize: 16 }}>Loading your studio...</div>;

  const TABS = [
    ["book", "Book", "📅"], ["manage", "Manage", "📋"], ["reminders", "Alerts", "🔔"],
    ["payments", "Payments", "💵"], ["dashboard", "Stats", "📊"], ["clients", "Clients", "👥"],
    ["expenses", "Money", "💸"], ["promo", "Promo", "📣"], ["waitlist", "Waitlist", "⏳"]
  ];

  const Card = ({ children, style = {}, glow = false }) => (
    <div style={{ background: "#fff", border: `0.5px solid ${glow ? accent : "#e8e0dc"}`, borderRadius: 16, padding: "16px 18px", marginBottom: 10, transition: "all 0.2s", ...(glow ? { boxShadow: `0 0 0 1px ${accent}22` } : {}), ...style }}>{children}</div>
  );

  const Btn = ({ children, onClick, disabled, variant = "primary", style = {} }) => {
    const styles = {
      primary: { background: `linear-gradient(135deg, ${accent}, #D4724F)`, color: "#fff", border: "none" },
      outline: { background: "transparent", color: accent, border: `1.5px solid ${accent}` },
      soft: { background: accentLight, color: accentDark, border: "none" },
    };
    return <button onClick={onClick} disabled={disabled} style={{ padding: "12px 18px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, width: "100%", letterSpacing: 0.3, transition: "all 0.15s", ...styles[variant], ...style }}>{children}</button>;
  };

  const MiniBtn = ({ children, onClick, bg = accentLight, color = accentDark, style = {} }) => (
    <button onClick={onClick} style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer", ...style }}>{children}</button>
  );

  const Input = ({ label, ...props }) => (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>}
      <input {...props} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 14, background: "#fff", color: "#333", boxSizing: "border-box", outline: "none", ...props.style }} />
    </div>
  );

  const StatusBadge = ({ status }) => {
    const m = { confirmed: [accentLight, accentDark, "Confirmed"], completed: ["#E8F4ED", "#2D6A4F", "Completed"], cancelled: ["#FCE8E8", "#C0392B", "Cancelled"], noshow: ["#FEF3E2", "#B7791F", "No-show"] };
    const [bg, col, label] = m[status] || m.confirmed;
    return <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: col }}>{label}</span>;
  };

  const SectionTitle = ({ children, sub }) => (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#333", margin: 0, fontFamily: "'Georgia', serif" }}>{children}</h2>
      {sub && <p style={{ fontSize: 13, color: "#999", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );

  const Metric = ({ value, label, icon }) => (
    <div style={{ background: cream, borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
      {icon && <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 22, fontWeight: 700, color: accent, fontFamily: "'Georgia', serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', -apple-system, sans-serif", color: "#333", maxWidth: 520, margin: "0 auto", padding: "0 12px 2rem", background: "#FDF8F5", minHeight: "100vh" }}>
      {toast && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", padding: "10px 24px", borderRadius: 14, fontSize: 13, fontWeight: 600, zIndex: 999, background: toast.type === "err" ? "#FCE8E8" : "#E8F4ED", color: toast.type === "err" ? "#C0392B" : "#2D6A4F" }}>{toast.msg}</div>}

      {showLinksModal && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Georgia', serif", color: "#333", marginBottom: 4 }}>Booking confirmed!</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Now send confirmation & add to calendar</div>
          <a href={showWaLink} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "14px", borderRadius: 12, background: "#25D366", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 10 }}>📩 Send WhatsApp Confirmation</a>
          <a href={showCalLink} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "14px", borderRadius: 12, background: "#4285F4", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", marginBottom: 10 }}>📅 Add to Google Calendar</a>
          <button onClick={() => setShowLinksModal(false)} style={{ padding: "12px", borderRadius: 12, border: "1px solid #e8e0dc", background: "#fff", color: "#888", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }}>Done</button>
        </div>
      </div>}

      <div style={{ textAlign: "center", padding: "20px 0 6px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 4, color: "#999", marginBottom: 4 }}>✦ STUDIO MANAGER ✦</div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 1, color: accent, fontFamily: "'Georgia', serif" }}>The Nail Villa</div>
        <div style={{ width: 40, height: 2, background: accent, margin: "8px auto 0", borderRadius: 1 }} />
      </div>

      {todayBdays.length > 0 && <div style={{ background: "#FEF3E2", borderRadius: 14, padding: "10px 16px", margin: "12px 0", fontSize: 13, color: "#B7791F", display: "flex", alignItems: "center", justifyContent: "space-between" }}><span>🎂 {todayBdays.map(c => firstName(c.name)).join(", ")}'s birthday!</span><MiniBtn bg="#B7791F" color="#fff" onClick={() => todayBdays.forEach(c => openWA(c.phone, getBdayMsg(c)))}>Send wish</MiniBtn></div>}

      {todayBookings.length > 0 && tab !== "book" && <div style={{ background: accentLight, borderRadius: 14, padding: "12px 16px", margin: "8px 0 12px", fontSize: 13, color: accentDark }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>📌 Today — {todayBookings.length} appointment{todayBookings.length > 1 ? "s" : ""}</div>
        {todayBookings.map(b => <div key={b.id} style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{fmtTime(b.time)} — {firstName(b.name)} · {b.services.join(", ")}</div>)}
      </div>}

      <div style={{ display: "flex", gap: 4, padding: "14px 0", overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map(([t, l, icon]) => (
          <button key={t} onClick={() => { setTab(t); setSubTab(""); setClientView(null); if (t !== "book") { setEditId(null); setForm({ name: "", phone: "", date: "", time: "", services: [], notes: "", price: "" }); } }}
            style={{ padding: "10px 8px", borderRadius: 14, border: tab === t ? `2px solid ${accent}` : "1px solid #e8e0dc", background: tab === t ? accentLight : "transparent", color: tab === t ? accentDark : "#999", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", minWidth: 48, textAlign: "center", position: "relative" }}>
            <div style={{ fontSize: 16 }}>{icon}</div>
            <div style={{ marginTop: 2 }}>{l}</div>
            {t === "reminders" && upcomingReminders.length > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: "#E74C3C" }} />}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>

        {tab === "book" && <div>
          <SectionTitle sub={editId ? "Update this appointment" : "Create a new appointment"}>{editId ? "Edit Booking" : "New Booking"}</SectionTitle>
          <Input label="WhatsApp number" placeholder="10-digit number" type="tel" value={form.phone} onChange={e => { const v = e.target.value.replace(/[^0-9+]/g, ""); setForm({ ...form, phone: v }); if (v.replace(/\D/g, "").length >= 10) fillFromPhone(v); }} />
          <Input label="Client name" placeholder="Enter name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 0.8 }}>Services</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SERVICES.map(svc => {
                const sel = form.services.includes(svc.name);
                return <button key={svc.id} onClick={() => toggleSvc(svc)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 14, border: sel ? `2px solid ${accent}` : "1px solid #e8e0dc", background: sel ? accentLight : "#fff", color: sel ? accentDark : "#333", fontSize: 13, fontWeight: sel ? 600 : 400, cursor: "pointer" }}>
                  <span>{svc.icon}</span> {svc.name} <span style={{ fontSize: 11, opacity: 0.6 }}>{fmtDur(svc.duration)}</span>
                </button>;
              })}
            </div>
            {form.services.length > 0 && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: rose, fontSize: 13, fontWeight: 600, color: accentDark }}>
              {form.services.length} service{form.services.length > 1 ? "s" : ""} · {fmtDur(totalMin)}
            </div>}
          </div>

          <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 0.8 }}>Time slot</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {["Morning", "Afternoon", "Evening"].map(p => {
                const ranges = { Morning: [11, 13], Afternoon: [13, 17], Evening: [17, 21] };
                const [s] = ranges[p];
                const active = form.time && parseInt(form.time.split(":")[0]) >= ranges[p][0] && parseInt(form.time.split(":")[0]) < ranges[p][1];
                return <button key={p} onClick={() => setForm({ ...form, time: `${s}:00` })} style={{ flex: 1, padding: "8px", borderRadius: 10, border: active ? `2px solid ${accent}` : "1px solid #e8e0dc", background: active ? accentLight : "transparent", color: active ? accentDark : "#999", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{p}</button>;
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {(() => {
                const slots = []; for (let h = 11; h < 21; h++) { if (h === 11) { slots.push("11:30"); } else { slots.push(`${h}:00`); if (h < 21) slots.push(`${h}:30`); } }
                const booked = data.bookings.filter(b => b.date === form.date && b.status === "confirmed").map(b => b.time);
                return slots.map(sl => {
                  const bk = booked.includes(sl); const active = form.time === sl;
                  return <button key={sl} disabled={bk} onClick={() => !bk && setForm({ ...form, time: sl })} style={{ padding: "11px 0", borderRadius: 12, border: active ? `2px solid ${accent}` : "1px solid #e8e0dc", background: active ? accent : bk ? "#f0ebe8" : "#fff", color: active ? "#fff" : bk ? "#ccc" : "#333", fontSize: 13, fontWeight: active ? 700 : 400, cursor: bk ? "not-allowed" : "pointer", opacity: bk ? 0.4 : 1, textAlign: "center" }}>{fmtTime(sl)}{bk && <div style={{ fontSize: 9, marginTop: 1 }}>Booked</div>}</button>;
                });
              })()}
            </div>
          </div>

          <Btn onClick={handleBook} disabled={!form.name || !form.phone || !form.date || !form.time || form.services.length === 0}>{editId ? "Update Booking" : "Book & Send WhatsApp + Calendar"}</Btn>
          {editId && <div style={{ marginTop: 8 }}><Btn variant="outline" onClick={() => { setEditId(null); setForm({ name: "", phone: "", date: "", time: "", services: [], notes: "", price: "" }); }}>Cancel Edit</Btn></div>}
        </div>}

        {tab === "manage" && <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 14, background: "#fff", color: "#333", outline: "none" }} placeholder="Search name or phone..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            {!searchQ && <input style={{ width: 145, padding: "12px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 13, background: "#fff", color: "#333" }} type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />}
          </div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 10, fontWeight: 500 }}>{searchQ ? `${filteredBookings.length} results` : `${fmtDateNice(filterDate)} — ${filteredBookings.length} bookings`}</div>
          {filteredBookings.length === 0 && <div style={{ textAlign: "center", padding: "3rem 0", color: "#ccc", fontSize: 14 }}>No bookings found</div>}
          {[...filteredBookings].sort((a, b) => a.time.localeCompare(b.time)).map(b => (
            <Card key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{firstName(b.name)}</span>
                <StatusBadge status={b.status} />
              </div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.8 }}>
                📱 {b.phone}<br />📅 {fmtDateShort(b.date)} · ⏰ {fmtTime(b.time)}<br />💅 {b.services.join(", ")}
              </div>
              {b.notes && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>📝 {b.notes}</div>}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {b.status === "confirmed" && <MiniBtn bg="#E8F4ED" color="#2D6A4F" onClick={() => completeBooking(b)}>✓ Done + Thanks</MiniBtn>}
                <MiniBtn onClick={() => openWA(b.phone, getRemMsg(b))}>📩 Remind</MiniBtn>
                <MiniBtn bg="#FEF3E2" color="#B7791F" onClick={() => startEdit(b)}>✏️ Edit</MiniBtn>
                {b.status === "confirmed" && <MiniBtn bg="#f5f0ed" color="#888" onClick={() => markStatus(b.id, "cancelled")}>Cancel</MiniBtn>}
                {b.status === "confirmed" && <MiniBtn bg="#f5f0ed" color="#888" onClick={() => markStatus(b.id, "noshow")}>No-show</MiniBtn>}
                <MiniBtn bg="#FCE8E8" color="#C0392B" onClick={() => { if (confirm("Delete?")) deleteBooking(b.id); }}>🗑</MiniBtn>
              </div>
            </Card>
          ))}
        </div>}

        {tab === "reminders" && <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[["rem", "Reminders"], ["thankyou", "Thank You"], ["inactive", "Follow-up"], ["bday", "Birthdays"]].map(([k, l]) => (
              <button key={k} style={{ flex: 1, padding: "10px", borderRadius: 12, border: (subTab === k || (!subTab && k === "rem")) ? `2px solid ${accent}` : "1px solid #e8e0dc", background: (subTab === k || (!subTab && k === "rem")) ? accentLight : "transparent", color: (subTab === k || (!subTab && k === "rem")) ? accentDark : "#999", fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => setSubTab(k)}>{l}</button>
            ))}
          </div>

          {(subTab === "" || subTab === "rem") && <div>
            <SectionTitle sub="Clients with appointments in the next 15 hours">Due Reminders ({upcomingReminders.length})</SectionTitle>
            {upcomingReminders.length === 0 && <div style={{ textAlign: "center", padding: "2rem 0", color: "#ccc" }}>No reminders due right now ✨</div>}
            {upcomingReminders.map(b => {
              const hrs = Math.round((new Date(`${b.date}T${b.time}:00`) - now) / 3600000);
              return <Card key={b.id} glow>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Georgia', serif" }}>{firstName(b.name)}</span>
                  <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>in ~{hrs}h</span>
                </div>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>⏰ {fmtTime(b.time)} · {b.services.join(", ")}</div>
                <Btn style={{ padding: "10px" }} onClick={() => { openWA(b.phone, getRemMsg(b)); save({ ...data, bookings: data.bookings.map(x => x.id === b.id ? { ...x, reminderSent: true } : x) }); flash("Sent!"); }}>Send Reminder via WhatsApp</Btn>
              </Card>;
            })}
            <div style={{ marginTop: 24 }}>
              <SectionTitle>Today's Appointments ({todayBookings.length})</SectionTitle>
              {todayBookings.map(b => <Card key={b.id}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: 600, fontSize: 14 }}>{firstName(b.name)}</div><div style={{ fontSize: 12, color: "#888" }}>{fmtTime(b.time)} · {b.services.join(", ")}</div></div>{b.reminderSent && <span style={{ fontSize: 11, color: "#2D6A4F", fontWeight: 600 }}>✓ Reminded</span>}</div></Card>)}
            </div>
          </div>}

          {subTab === "thankyou" && <div>
            <SectionTitle sub="Send a thank you message after their visit">Thank You Messages</SectionTitle>
            {(() => {
              const completedToday = data.bookings.filter(b => b.date === todayStr() && b.status === "completed");
              const confirmedToday = data.bookings.filter(b => b.date === todayStr() && b.status === "confirmed");
              return <>
                {confirmedToday.length === 0 && completedToday.length === 0 && <div style={{ textAlign: "center", padding: "2rem 0", color: "#ccc" }}>No appointments today</div>}
                {confirmedToday.length > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10 }}>Today's appointments</div>}
                {confirmedToday.map(b => (
                  <Card key={b.id} glow>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{firstName(b.name)}</span>
                      <span style={{ fontSize: 12, color: "#888" }}>{fmtTime(b.time)} · {b.services.join(", ")}</span>
                    </div>
                    <Btn style={{ padding: "10px", fontSize: 12 }} onClick={() => completeBooking(b)}>✓ Mark Done & Send Thank You</Btn>
                  </Card>
                ))}
                {completedToday.length > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginTop: 16, marginBottom: 10 }}>Completed today</div>}
                {completedToday.map(b => (
                  <Card key={b.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{firstName(b.name)}</span>
                      <span style={{ fontSize: 11, color: "#2D6A4F", fontWeight: 600 }}>✓ Completed</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{fmtTime(b.time)} · {b.services.join(", ")}</div>
                    <MiniBtn onClick={() => openWA(b.phone, getTyMsg(b))}>Send Thank You again</MiniBtn>
                  </Card>
                ))}
                <Card style={{ background: cream, border: "none", marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Message preview</div>
                  <div style={{ fontSize: 13, whiteSpace: "pre-line", lineHeight: 1.6 }}>Hi [Name],{"\n\n"}Thank you for visiting The Nail Villa 💅{"\n"}It was a pleasure having you!{"\n"}Hope you loved your nails—see you again soon 💖</div>
                </Card>
              </>;
            })()}
          </div>}

          {subTab === "inactive" && <div>
            <SectionTitle sub="Haven't visited in 3+ weeks">Follow Up ({inactiveClients.length})</SectionTitle>
            {inactiveClients.length === 0 && <div style={{ textAlign: "center", padding: "2rem 0", color: "#ccc" }}>All clients are active!</div>}
            {inactiveClients.map(c => {
              const days = Math.round((now - new Date(c.lastVisit + "T00:00:00")) / 86400000);
              return <Card key={c.phone}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Georgia', serif" }}>{firstName(c.name)}</span><span style={{ fontSize: 12, color: accent }}>{days}d ago</span></div><div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{c.visits} visits · ₹{c.totalSpent} total</div><MiniBtn onClick={() => openWA(c.phone, getBookAgainMsg(c))}>Send "book again" message</MiniBtn></Card>;
            })}
          </div>}

          {subTab === "bday" && <div>
            <SectionTitle sub="Set birthdays in the Clients tab">Birthdays</SectionTitle>
            {todayBdays.length > 0 && <Card style={{ background: "#FEF3E2", border: "none" }}><div style={{ fontWeight: 700, color: "#B7791F", marginBottom: 8 }}>🎂 Today!</div>{todayBdays.map(c => <div key={c.phone} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><span>{firstName(c.name)}</span><MiniBtn bg="#B7791F" color="#fff" onClick={() => openWA(c.phone, getBdayMsg(c))}>Send wish</MiniBtn></div>)}</Card>}
            {todayBdays.length === 0 && <div style={{ textAlign: "center", padding: "2rem 0", color: "#ccc" }}>No birthdays today</div>}
          </div>}
        </div>}

        {tab === "payments" && <div>
          <SectionTitle sub="Record daily payments & track monthly totals">Payment Records</SectionTitle>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[["day", "Daily"], ["month", "Monthly"]].map(([k, l]) => (
              <button key={k} onClick={() => setSubTab(k)} style={{ flex: 1, padding: "10px", borderRadius: 12, border: (subTab === k || (!subTab && k === "day")) ? `2px solid ${accent}` : "1px solid #e8e0dc", background: (subTab === k || (!subTab && k === "day")) ? accentLight : "transparent", color: (subTab === k || (!subTab && k === "day")) ? accentDark : "#999", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{l}</button>
            ))}
          </div>

          {(subTab === "" || subTab === "day") && <div>
            <Card style={{ background: cream, border: "none", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Record a payment</div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4, display: "block" }}>Client (from today's bookings)</label>
                <select style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 13, background: "#fff", color: "#333" }} value={payForm.bookingId} onChange={e => {
                  const bk = data.bookings.find(b => b.id === e.target.value);
                  if (bk) setPayForm({ ...payForm, bookingId: e.target.value, amount: bk.price?.toString() || "" });
                  else setPayForm({ ...payForm, bookingId: e.target.value });
                }}>
                  <option value="">Select or add manually below</option>
                  {data.bookings.filter(b => b.date === todayStr()).map(b => <option key={b.id} value={b.id}>{firstName(b.name)} — {b.services.join(", ")}</option>)}
                </select>
              </div>
              {!payForm.bookingId && <Input label="Client name (manual)" placeholder="Name" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4, display: "block" }}>Amount</label>
                  <input style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 14, background: "#fff", color: "#333", boxSizing: "border-box" }} placeholder="₹" type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4, display: "block" }}>Method</label>
                  <select style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 13, background: "#fff", color: "#333" }} value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                    <option value="cash">💵 Cash</option>
                    <option value="upi">📱 UPI</option>
                    <option value="card">💳 Card</option>
                    <option value="other">🔄 Other</option>
                  </select>
                </div>
              </div>
              <Btn onClick={() => {
                if (!payForm.amount) { flash("Enter amount", "err"); return; }
                const bk = data.bookings.find(b => b.id === payForm.bookingId);
                const name = bk ? bk.name : (payForm.notes || "Walk-in");
                const phone = bk ? bk.phone : "";
                const services = bk ? bk.services : [];
                addPayment(payForm.bookingId, name, phone, services, payForm.amount, payForm.method, payForm.notes);
                setPayForm({ bookingId: "", amount: "", method: "cash", notes: "" });
              }}>Record Payment</Btn>
            </Card>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Georgia', serif" }}>Daily view</span>
              <input style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e8e0dc", fontSize: 13, background: "#fff", color: "#333" }} type="date" value={payDay} onChange={e => setPayDay(e.target.value)} />
            </div>

            {(() => {
              const dayPayments = data.payments.filter(p => p.date === payDay);
              const dayTotal = dayPayments.reduce((s, p) => s + p.amount, 0);
              const cashTotal = dayPayments.filter(p => p.method === "cash").reduce((s, p) => s + p.amount, 0);
              const upiTotal = dayPayments.filter(p => p.method === "upi").reduce((s, p) => s + p.amount, 0);
              const cardTotal = dayPayments.filter(p => p.method === "card").reduce((s, p) => s + p.amount, 0);
              return <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  <Metric icon="💵" value={`₹${cashTotal.toLocaleString()}`} label="Cash" />
                  <Metric icon="📱" value={`₹${upiTotal.toLocaleString()}`} label="UPI" />
                  <Metric icon="💳" value={`₹${cardTotal.toLocaleString()}`} label="Card" />
                </div>
                <div style={{ background: accentLight, borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: accentDark }}>Day total</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: accent, fontFamily: "'Georgia', serif" }}>₹{dayTotal.toLocaleString()}</span>
                </div>
                {dayPayments.length === 0 && <div style={{ textAlign: "center", padding: "2rem 0", color: "#ccc" }}>No payments recorded for this day</div>}
                {dayPayments.map(p => (
                  <Card key={p.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{firstName(p.name)}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: accent }}>₹{p.amount.toLocaleString()}</span>
                    </div>
                    {p.services?.length > 0 && <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>💅 {p.services.join(", ")}</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 8, background: p.method === "cash" ? "#E8F4ED" : p.method === "upi" ? "#E6F0FB" : "#FEF3E2", color: p.method === "cash" ? "#2D6A4F" : p.method === "upi" ? "#1A5FA5" : "#B7791F", fontSize: 11, fontWeight: 600 }}>{p.method === "cash" ? "💵 Cash" : p.method === "upi" ? "📱 UPI" : p.method === "card" ? "💳 Card" : "🔄 Other"}</span>
                        <span style={{ marginLeft: 8 }}>{p.time}</span>
                      </div>
                      <MiniBtn bg="#FCE8E8" color="#C0392B" onClick={() => deletePayment(p.id)} style={{ fontSize: 10 }}>×</MiniBtn>
                    </div>
                  </Card>
                ))}
              </>;
            })()}
          </div>}

          {subTab === "month" && <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Georgia', serif" }}>Monthly summary</span>
              <input style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e8e0dc", fontSize: 13, background: "#fff", color: "#333" }} type="month" value={payMonth} onChange={e => setPayMonth(e.target.value)} />
            </div>

            {(() => {
              const monthPayments = data.payments.filter(p => p.date.startsWith(payMonth));
              const monthTotal = monthPayments.reduce((s, p) => s + p.amount, 0);
              const cashTotal = monthPayments.filter(p => p.method === "cash").reduce((s, p) => s + p.amount, 0);
              const upiTotal = monthPayments.filter(p => p.method === "upi").reduce((s, p) => s + p.amount, 0);
              const cardTotal = monthPayments.filter(p => p.method === "card").reduce((s, p) => s + p.amount, 0);
              const monthExpenses = data.expenses.filter(e => e.date.startsWith(payMonth)).reduce((s, e) => s + e.amount, 0);
              const dayWise = {};
              monthPayments.forEach(p => { if (!dayWise[p.date]) dayWise[p.date] = { payments: [], total: 0 }; dayWise[p.date].payments.push(p); dayWise[p.date].total += p.amount; });
              const sortedDays = Object.keys(dayWise).sort().reverse();

              return <>
                <Card style={{ background: accentLight, border: "none", marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: accentDark, marginBottom: 4 }}>Total revenue this month</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: accent, fontFamily: "'Georgia', serif" }}>₹{monthTotal.toLocaleString()}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 13 }}>
                    <span style={{ color: "#2D6A4F", fontWeight: 600 }}>- ₹{monthExpenses.toLocaleString()} expenses</span>
                    <span style={{ color: accent, fontWeight: 700 }}>= ₹{(monthTotal - monthExpenses).toLocaleString()} profit</span>
                  </div>
                </Card>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  <Metric icon="💵" value={`₹${cashTotal.toLocaleString()}`} label="Cash" />
                  <Metric icon="📱" value={`₹${upiTotal.toLocaleString()}`} label="UPI" />
                  <Metric icon="💳" value={`₹${cardTotal.toLocaleString()}`} label="Card" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  <Metric value={monthPayments.length} label="Total payments" />
                  <Metric value={monthPayments.length ? `₹${Math.round(monthTotal / monthPayments.length)}` : "-"} label="Avg per client" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Georgia', serif", marginBottom: 12 }}>Day-by-day breakdown</div>
                {sortedDays.length === 0 && <div style={{ textAlign: "center", padding: "2rem 0", color: "#ccc" }}>No payments this month</div>}
                {sortedDays.map(day => (
                  <Card key={day}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{fmtDateShort(day)}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: accent }}>₹{dayWise[day].total.toLocaleString()}</span>
                    </div>
                    {dayWise[day].payments.map(p => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "0.5px solid #e8e0dc" }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
                          {p.services?.length > 0 && <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>{p.services.join(", ")}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: p.method === "cash" ? "#E8F4ED" : p.method === "upi" ? "#E6F0FB" : "#FEF3E2", color: p.method === "cash" ? "#2D6A4F" : p.method === "upi" ? "#1A5FA5" : "#B7791F" }}>{p.method}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>₹{p.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </Card>
                ))}
              </>;
            })()}
          </div>}
        </div>}

        {tab === "dashboard" && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <SectionTitle>Dashboard</SectionTitle>
            <div style={{ display: "flex", gap: 4 }}>
              {[["week", "7d"], ["month", "30d"], ["year", "1y"]].map(([k, l]) => (
                <button key={k} onClick={() => setDashPeriod(k)} style={{ padding: "6px 14px", borderRadius: 10, border: dashPeriod === k ? `2px solid ${accent}` : "1px solid #e8e0dc", background: dashPeriod === k ? accentLight : "transparent", color: dashPeriod === k ? accentDark : "#999", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <Metric icon="💰" value={`₹${periodRevenue.toLocaleString()}`} label="Revenue" />
            <Metric icon="📈" value={`₹${(periodRevenue - periodExpenses).toLocaleString()}`} label="Profit" />
            <Metric icon="📅" value={periodBookings.length} label="Appointments" />
            <Metric icon="💸" value={`₹${periodExpenses.toLocaleString()}`} label="Expenses" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <Metric value={periodBookings.length ? `₹${Math.round(periodRevenue / periodBookings.length)}` : "-"} label="Avg per visit" />
            <Metric value={data.clients.length} label="Total clients" />
          </div>
          {topServices.length > 0 && <Card><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: "'Georgia', serif" }}>Top services</div>{topServices.slice(0, 5).map(([name, count]) => <div key={name} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{name}</span><span style={{ color: "#888", fontWeight: 600 }}>{count}x</span></div><div style={{ height: 8, borderRadius: 4, background: "#f0ebe8" }}><div style={{ height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${accent}, #D4724F)`, width: `${count / topServices[0][1] * 100}%`, transition: "width 0.5s" }} /></div></div>)}</Card>}
          {busiestDay && <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>📊 Busiest day: <strong style={{ color: "#333" }}>{busiestDay[0]}</strong> ({busiestDay[1]} bookings)</div>}
        </div>}

        {tab === "clients" && !clientView && <div>
          <Input placeholder="Search clients..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          {data.clients.filter(c => !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.phone.includes(searchQ)).sort((a, b) => (b.visits || 0) - (a.visits || 0)).map(c => (
            <Card key={c.phone} style={{ cursor: "pointer" }}>
              <div onClick={() => setClientView(c)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: accent, fontFamily: "'Georgia', serif" }}>{firstName(c.name).charAt(0)}</div>
                  <div><div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{firstName(c.name)}</div><div style={{ fontSize: 12, color: "#888" }}>{c.phone} · {c.visits || 0} visits · ₹{(c.totalSpent || 0).toLocaleString()}</div>{c.visits >= 5 && <span style={{ display: "inline-block", marginTop: 3, padding: "2px 10px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: "#FEF3E2", color: "#B7791F" }}>⭐ Loyal</span>}</div>
                </div>
                <span style={{ fontSize: 18, color: "#ccc" }}>›</span>
              </div>
            </Card>
          ))}
          {data.clients.length === 0 && <div style={{ textAlign: "center", padding: "3rem 0", color: "#ccc" }}>Clients will appear after their first booking</div>}
        </div>}

        {tab === "clients" && clientView && <div>
          <MiniBtn bg="#f5f0ed" color="#888" onClick={() => setClientView(null)}>← Back</MiniBtn>
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 24, fontWeight: 700, color: accent, fontFamily: "'Georgia', serif" }}>{firstName(clientView.name).charAt(0)}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Georgia', serif" }}>{firstName(clientView.name)}</div>
            <div style={{ fontSize: 14, color: "#888" }}>{clientView.phone}</div>
            {(clientView.visits || 0) >= 5 && <span style={{ display: "inline-block", marginTop: 8, padding: "4px 14px", borderRadius: 14, fontSize: 12, fontWeight: 600, background: "#FEF3E2", color: "#B7791F" }}>⭐ Loyal client</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
            <Metric value={clientView.visits || 0} label="Visits" />
            <Metric value={`₹${(clientView.totalSpent || 0).toLocaleString()}`} label="Spent" />
            <Metric value={clientView.lastVisit ? fmtDateShort(clientView.lastVisit) : "-"} label="Last visit" />
          </div>
          <Card><Input label="Birthday" type="date" value={clientView.birthday || ""} onChange={e => updateClientField(clientView.phone, "birthday", e.target.value)} /></Card>
          <Card><Input label="Favorite colors / preferences" value={clientView.favColors || ""} placeholder="Pink, French tips..." onChange={e => updateClientField(clientView.phone, "favColors", e.target.value)} /></Card>
          <Card><Input label="Notes" value={clientView.notes || ""} placeholder="Any notes..." onChange={e => updateClientField(clientView.phone, "notes", e.target.value)} /></Card>
          {clientView.serviceHistory?.length > 0 && <div style={{ marginTop: 16 }}><SectionTitle>Visit History</SectionTitle>{[...clientView.serviceHistory].reverse().map((v, i) => <Card key={i}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{v.services.join(", ")}</div><div style={{ fontSize: 12, color: "#888" }}>{fmtDateShort(v.date)}</div></div><span style={{ fontSize: 14, fontWeight: 700, color: accent }}>₹{v.price}</span></div></Card>)}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <div style={{ flex: 1 }}><Btn variant="soft" onClick={() => openWA(clientView.phone, getBookAgainMsg(clientView))} style={{ fontSize: 12, padding: 10 }}>📩 Book again</Btn></div>
            <div style={{ flex: 1 }}><Btn variant="soft" onClick={() => openWA(clientView.phone, getBdayMsg(clientView))} style={{ fontSize: 12, padding: 10 }}>🎂 Birthday wish</Btn></div>
          </div>
        </div>}

        {tab === "expenses" && <div>
          <SectionTitle sub="Track your supplies, tools & costs">Expenses</SectionTitle>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Input placeholder="Item name" value={expForm.item} onChange={e => setExpForm({ ...expForm, item: e.target.value })} style={{ flex: 2 }} />
            <Input placeholder="₹ Amount" type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} style={{ flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 13, background: "#fff", color: "#333" }} type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
            <select style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 13, background: "#fff", color: "#333" }} value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
              <option value="supplies">Supplies</option><option value="tools">Tools</option><option value="rent">Rent</option><option value="marketing">Marketing</option><option value="other">Other</option>
            </select>
          </div>
          <Btn onClick={addExpense} style={{ marginBottom: 20 }}>Add Expense</Btn>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <Metric icon="📅" value={`₹${data.expenses.filter(e => e.date >= daysAgo(30)).reduce((s, e) => s + e.amount, 0).toLocaleString()}`} label="This month" />
            <Metric icon="📊" value={`₹${data.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}`} label="All time" />
          </div>
          {[...data.expenses].reverse().map(e => <Card key={e.id}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 14, fontWeight: 600 }}>{e.item}</div><div style={{ fontSize: 12, color: "#888" }}>{fmtDateShort(e.date)} · {e.category}</div></div><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 14, fontWeight: 700, color: "#C0392B" }}>₹{e.amount}</span><MiniBtn bg="#FCE8E8" color="#C0392B" onClick={() => deleteExpense(e.id)}>×</MiniBtn></div></div></Card>)}
        </div>}

        {tab === "promo" && <div>
          <SectionTitle sub="Send offers to all your clients at once">Promotions</SectionTitle>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {[["🎉 Festive offer", `🌸 Festive Special at *The Nail Villa*!\n\nGet 20% off on all nail extensions this week! Book now! 💅✨\n\n${MAP_LINK}`], ["✨ New service", `✨ New at *The Nail Villa*!\n\nWe've introduced new designs & premium gel polishes! Come check them out! 💅🌸\n\n${MAP_LINK}`], ["🔥 Weekend deal", `💖 Weekend Special at *The Nail Villa*!\n\nBook any 2 services and get a free upgrade! Limited slots! 💅\n\n${MAP_LINK}`]].map(([l, m]) => <MiniBtn key={l} onClick={() => setPromoMsg(m)}>{l}</MiniBtn>)}
          </div>
          <textarea style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1px solid #e8e0dc", fontSize: 14, background: "#fff", color: "#333", height: 140, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} placeholder="Type your promotional message..." value={promoMsg} onChange={e => setPromoMsg(e.target.value)} />
          <div style={{ fontSize: 12, color: "#888", margin: "8px 0 14px" }}>{data.clients.length} clients will receive this</div>
          <Btn disabled={!promoMsg} onClick={() => { if (!confirm(`Send to ${data.clients.length} clients?`)) return; data.clients.forEach((c, i) => setTimeout(() => openWA(c.phone, promoMsg), i * 800)); flash(`Sending to ${data.clients.length} clients...`); }}>Send to All Clients ({data.clients.length})</Btn>
          <div style={{ marginTop: 24 }}>
            <SectionTitle>Send to Specific Client</SectionTitle>
            {data.clients.map(c => <Card key={c.phone}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 14, fontWeight: 600 }}>{firstName(c.name)}</div><div style={{ fontSize: 12, color: "#888" }}>{c.phone}</div></div><MiniBtn disabled={!promoMsg} onClick={() => promoMsg && openWA(c.phone, promoMsg)}>Send</MiniBtn></div></Card>)}
          </div>
        </div>}

        {tab === "waitlist" && <div>
          <SectionTitle sub="When a slot opens, notify these clients">Waitlist</SectionTitle>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Input placeholder="Name" value={waitForm.name} onChange={e => setWaitForm({ ...waitForm, name: e.target.value })} />
            <Input placeholder="Phone" value={waitForm.phone} onChange={e => setWaitForm({ ...waitForm, phone: e.target.value.replace(/[^0-9+]/g, "") })} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <select style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #e8e0dc", fontSize: 13, background: "#fff", color: "#333" }} value={waitForm.service} onChange={e => setWaitForm({ ...waitForm, service: e.target.value })}>
                <option value="">Service wanted</option>{SERVICES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <Input placeholder="Notes" value={waitForm.notes} onChange={e => setWaitForm({ ...waitForm, notes: e.target.value })} style={{ flex: 1 }} />
          </div>
          <Btn onClick={addWaitlist} style={{ marginBottom: 20 }}>Add to Waitlist</Btn>
          {data.waitlist.length === 0 && <div style={{ textAlign: "center", padding: "2rem 0", color: "#ccc" }}>Waitlist is empty</div>}
          {data.waitlist.map(w => <Card key={w.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Georgia', serif" }}>{firstName(w.name)}</span><span style={{ fontSize: 12, color: "#888" }}>{w.phone}</span></div>
            {w.service && <div style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>Wants: {w.service}</div>}
            {w.notes && <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>{w.notes}</div>}
            <div style={{ display: "flex", gap: 6 }}>
              <MiniBtn bg="#E8F4ED" color="#2D6A4F" onClick={() => { setForm({ name: w.name, phone: w.phone, date: "", time: "", services: w.service ? [w.service] : [], notes: w.notes || "", price: "" }); setTab("book"); }}>Book now</MiniBtn>
              <MiniBtn onClick={() => openWA(w.phone, `Hi ${firstName(w.name)}! 🌸\n\nA slot has opened up at *The Nail Villa*! Would you like to book?\n\nLet us know your preferred date & time! 💅`)}>Notify via WhatsApp</MiniBtn>
              <MiniBtn bg="#FCE8E8" color="#C0392B" onClick={() => removeWaitlist(w.id)}>Remove</MiniBtn>
            </div>
          </Card>)}
        </div>}
      </div>

      <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#ccc", fontFamily: "'Georgia', serif" }}>✦ The Nail Villa · Pimpri-Chinchwad, Pune ✦</div>
    </div>
  );
}
