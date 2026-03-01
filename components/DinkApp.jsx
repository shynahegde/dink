import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   DINK — Pickleball Tournament Manager
   Login → Paywall → Full App
   Senior-friendly · Light theme · Stripe · DUPR · Google Maps
   ═══════════════════════════════════════════════════════════ */

// ── API Integration Layer ──────────────────────────────────
const API = {
  // Stripe
  async createCheckout() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: "price_dink_9_monthly", trial: 7 }),
    });
    return res.json();
  },
  // DUPR
  async getDUPR(id) {
    const res = await fetch(`https://api.dupr.gg/v1/player/${id}`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("dupr_token")}` },
    });
    return res.json();
  },
  async postMatch(data) {
    return fetch("https://api.dupr.gg/v1/match", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("dupr_token")}` },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },
  // Google Maps Places
  async courts(lat, lng) {
    return fetch(`/api/courts?lat=${lat}&lng=${lng}`).then(r => r.json());
  },
  // Auth (Firebase / custom)
  async login(email, password) {
    return fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json());
  },
  async signup(name, email, password) {
    return fetch("/api/auth/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then(r => r.json());
  },
  async googleAuth() {
    window.location.href = "/api/auth/google";
  },
  // Push (Firebase)
  async registerPush(token) {
    return fetch("/api/push/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
  },
  // Tournaments feed
  async tournaments(region) {
    const url = region === "UK" ? "https://ukpickleball.org/api/events" : "https://usapickleball.org/api/v1/tournaments";
    return fetch(url).then(r => r.json()).catch(() => []);
  },
};

// ── Icons ──────────────────────────────────────────────────
const I = {
  Trophy: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Users: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Chart: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  MapPin: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Bag: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Check: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Star: (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Bell: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Gear: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
  Plus: (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Shield: (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Zap: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Phone: (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Eye: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Mail: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Lock: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  User: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  LogOut: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Home: (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Sun: (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  Target: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

// ── Shared Styles ──────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:0}
:root{--green:#16a34a;--green-light:#f0fdf4;--green-border:#bbf7d0;--green-bright:#22c55e;--bg:#f9fafb;--card:#ffffff;--border:#e5e7eb;--text:#111827;--text2:#4b5563;--text3:#9ca3af;--radius:16px}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.anim{animation:fadeUp .45s ease-out both}.a2{animation-delay:.06s}.a3{animation-delay:.12s}.a4{animation-delay:.18s}.a5{animation-delay:.24s}
.lift{transition:transform .2s,box-shadow .2s;cursor:pointer}
.lift:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.07)!important}
.lift:active{transform:scale(.98)}
.press{transition:transform .12s}.press:active{transform:scale(.96)}
`;

// ── Data ───────────────────────────────────────────────────
const DATA = {
  tournaments: [
    { id:1,name:"APP Chicago Open",date:"2026-03-14",loc:"Chicago, IL",fmt:"Bracket",status:"registered",dl:"2026-03-01",surface:"Indoor",partner:"Alex Rivera",tier:"APP Tour",fee:"$85" },
    { id:2,name:"PPA Desert Ridge Classic",date:"2026-04-05",loc:"Scottsdale, AZ",fmt:"Pool Play",status:"waitlisted",dl:"2026-03-20",surface:"Outdoor",partner:"TBD",tier:"PPA",fee:"$120" },
    { id:3,name:"UKPA National Championships",date:"2026-05-18",loc:"Birmingham, UK",fmt:"Round Robin",status:"open",dl:"2026-04-30",surface:"Indoor",partner:"James Chen",tier:"UKPA",fee:"£65" },
    { id:4,name:"Naperville Spring Smash",date:"2026-03-22",loc:"Naperville, IL",fmt:"Round Robin",status:"registered",dl:"2026-03-15",surface:"Outdoor",partner:"Maria Santos",tier:"Local",fee:"$45" },
    { id:5,name:"APP Austin Showdown",date:"2026-06-10",loc:"Austin, TX",fmt:"Bracket",status:"open",dl:"2026-05-25",surface:"Outdoor",partner:"TBD",tier:"APP Tour",fee:"$95" },
    { id:6,name:"Midwest Invitational",date:"2026-04-19",loc:"Indianapolis, IN",fmt:"Pool Play",status:"registered",dl:"2026-04-05",surface:"Indoor",partner:"Alex Rivera",tier:"Regional",fee:"$60" },
  ],
  partners: [
    { id:1,name:"Alex Rivera",dupr:4.8,avail:"Weekends",wr:72,m:34,chem:92,av:"AR",type:"Mixed" },
    { id:2,name:"Maria Santos",dupr:4.5,avail:"Flexible",wr:68,m:21,chem:88,av:"MS",type:"Doubles" },
    { id:3,name:"James Chen",dupr:4.2,avail:"Weekdays",wr:61,m:15,chem:79,av:"JC",type:"Doubles" },
    { id:4,name:"Priya Kapoor",dupr:5.1,avail:"Weekends",wr:78,m:8,chem:85,av:"PK",type:"Mixed" },
    { id:5,name:"Sam Okafor",dupr:4.6,avail:"Flexible",wr:65,m:12,chem:74,av:"SO",type:"Doubles" },
  ],
  matches: [
    { id:1,tourn:"APP Chicago Qualifier",date:"2026-02-15",partner:"Alex Rivera",opp:"Blake/Ward",score:"11-7, 11-9",r:"W",surface:"Indoor" },
    { id:2,tourn:"APP Chicago Qualifier",date:"2026-02-15",partner:"Alex Rivera",opp:"Gomez/Liu",score:"9-11, 11-8, 11-6",r:"W",surface:"Indoor" },
    { id:3,tourn:"Naperville Winter Classic",date:"2026-01-25",partner:"Maria Santos",opp:"Park/Nguyen",score:"7-11, 11-9, 8-11",r:"L",surface:"Indoor" },
    { id:4,tourn:"Naperville Winter Classic",date:"2026-01-25",partner:"Maria Santos",opp:"Adams/Kelly",score:"11-5, 11-3",r:"W",surface:"Indoor" },
    { id:5,tourn:"Midwest Fall Slam",date:"2025-11-10",partner:"Alex Rivera",opp:"Fischer/Brown",score:"11-8, 9-11, 11-7",r:"W",surface:"Outdoor" },
    { id:6,tourn:"Midwest Fall Slam",date:"2025-11-10",partner:"James Chen",opp:"Williams/Davis",score:"6-11, 8-11",r:"L",surface:"Outdoor" },
  ],
  courts: [
    { id:1,name:"Naperville Pickleball Center",addr:"123 Main St, Naperville, IL",surface:"Concrete",indoor:true,courts:12,lit:true,sanc:true,rate:4.8,dist:"2 mi" },
    { id:2,name:"DuPage County Recreation",addr:"456 Oak Ave, Wheaton, IL",surface:"Asphalt",indoor:false,courts:8,lit:true,sanc:false,rate:4.2,dist:"8 mi" },
    { id:3,name:"Centennial Beach Courts",addr:"500 Jackson Ave, Naperville, IL",surface:"Concrete",indoor:false,courts:6,lit:false,sanc:true,rate:4.5,dist:"3 mi" },
    { id:4,name:"Chicago Indoor Pickleball",addr:"789 State St, Chicago, IL",surface:"Wood",indoor:true,courts:16,lit:true,sanc:true,rate:4.9,dist:"32 mi" },
    { id:5,name:"Bolingbrook Sports Complex",addr:"321 Lindsey Ln, Bolingbrook, IL",surface:"Concrete",indoor:true,courts:10,lit:true,sanc:false,rate:4.1,dist:"12 mi" },
  ],
  gear: [
    { id:1,item:"Primary Paddle",cat:"Equipment",c:true },{ id:2,item:"Backup Paddle",cat:"Equipment",c:false },
    { id:3,item:"Tournament Balls (6-pack)",cat:"Equipment",c:true },{ id:4,item:"Grip Tape",cat:"Equipment",c:true },
    { id:5,item:"Court Shoes",cat:"Apparel",c:true },{ id:6,item:"Shirts (x3)",cat:"Apparel",c:false },
    { id:7,item:"Compression Socks",cat:"Apparel",c:true },{ id:8,item:"Water Bottle (64oz)",cat:"Nutrition",c:true },
    { id:9,item:"Electrolyte Packs",cat:"Nutrition",c:false },{ id:10,item:"Energy Bars",cat:"Nutrition",c:true },
    { id:11,item:"Sunscreen SPF 50",cat:"Other",c:false },{ id:12,item:"Towel",cat:"Other",c:true },
    { id:13,item:"First Aid Kit",cat:"Other",c:false },
  ],
};

const stColor = { registered:{bg:"#dcfce7",tx:"#166534",bd:"#bbf7d0",lb:"Registered"}, waitlisted:{bg:"#fef9c3",tx:"#854d0e",bd:"#fde68a",lb:"Waitlisted"}, open:{bg:"#dbeafe",tx:"#1e40af",bd:"#bfdbfe",lb:"Open"} };
const tierC = {"APP Tour":"#ea580c","PPA":"#db2777","UKPA":"#2563eb","Local":"#16a34a","Regional":"#7c3aed"};
const accents = ["#16a34a","#2563eb","#d97706","#db2777","#7c3aed"];

// ── Font Size Presets (senior-friendly) ────────────────────
const SIZES = {
  small:  { xs:11, sm:13, base:14, lg:16, xl:19, xxl:24, stat:22, btn:14, nav:10, tap:44 },
  medium: { xs:13, sm:15, base:16, lg:18, xl:22, xxl:28, stat:26, btn:16, nav:11, tap:48 },
  large:  { xs:14, sm:16, base:18, lg:21, xl:26, xxl:34, stat:30, btn:18, nav:12, tap:54 },
};

// ── Shared Components ──────────────────────────────────────
const Logo = ({ size = 72 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * .28, margin: "0 auto",
    background: "linear-gradient(145deg, #22c55e, #15803d)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 10px 36px rgba(34,197,94,.3)",
    animation: "float 4s ease-in-out infinite",
  }}>
    <span style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize: size*.44, color:"#fff" }}>D</span>
  </div>
);

const Btn = ({ children, primary, full, sz, style: sx, ...p }) => (
  <button className="press" {...p} style={{
    width: full ? "100%" : "auto", padding: `${sz?.tap ? sz.tap*.3 : 14}px ${sz?.tap ? sz.tap*.5 : 24}px`,
    borderRadius: 14, border: primary ? "none" : "1px solid var(--border)",
    background: primary ? "linear-gradient(145deg,#22c55e,#16a34a)" : "var(--card)",
    color: primary ? "#fff" : "var(--text2)", fontSize: sz?.btn || 16,
    fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito',sans-serif",
    boxShadow: primary ? "0 4px 14px rgba(34,197,94,.3)" : "0 1px 3px rgba(0,0,0,.04)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "transform .12s", ...sx,
  }}>{children}</button>
);

const Card = ({ children, className = "", style: sx, ...p }) => (
  <div className={`anim lift ${className}`} {...p} style={{
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
    padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.04)", ...sx,
  }}>{children}</div>
);

const Input = ({ icon, sz, type: initType = "text", togglePw, ...p }) => {
  const [show, setShow] = useState(false);
  const actualType = togglePw ? (show ? "text" : "password") : initType;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }}>{icon}</div>
      <input {...p} type={actualType} style={{
        width: "100%", padding: `${sz?.tap ? sz.tap * .32 : 16}px 16px 16px 48px`,
        borderRadius: 14, border: "2px solid var(--border)", background: "#f9fafb",
        fontSize: sz?.base || 16, fontFamily: "'Nunito',sans-serif", color: "var(--text)",
        outline: "none", transition: "border .2s",
      }} onFocus={e => e.target.style.borderColor = "#22c55e"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
      {togglePw && (
        <div onClick={() => setShow(!show)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--text3)" }}>
          {show ? I.EyeOff(18) : I.Eye(18)}
        </div>
      )}
    </div>
  );
};

const Tag = ({ children, bg, color: c, border: bd, style: sx }) => (
  <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: bg || "#f1f5f9", color: c || "#475569", border: `1px solid ${bd || "#e5e7eb"}`, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, ...sx }}>{children}</span>
);

// ════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════════
function LoginScreen({ onLogin, sz }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) return setError("Please fill in all fields");
    if (mode === "signup" && !form.name) return setError("Please enter your name");
    setLoading(true);
    try {
      const res = mode === "signup"
        ? await API.signup(form.name, form.email, form.password)
        : await API.login(form.email, form.password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        onLogin(res.user);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg,#f0fdf4 0%,#fff 40%,#f9fafb 100%)", fontFamily: "'Nunito',sans-serif", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 28px" }}>
      <style>{CSS}</style>

      <div className="anim" style={{ textAlign: "center", marginBottom: 32 }}>
        <Logo size={68} />
        <h1 style={{ fontWeight: 900, fontSize: sz.xxl, color: "var(--text)", letterSpacing: "-1px", marginTop: 16 }}>DINK</h1>
        <p style={{ fontSize: sz.sm, color: "var(--green)", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Tournament Manager</p>
      </div>

      <div className="anim a2" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: sz.xl, fontWeight: 800, color: "var(--text)", textAlign: "center", marginBottom: 6 }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p style={{ fontSize: sz.sm, color: "var(--text3)", textAlign: "center" }}>
          {mode === "login" ? "Sign in to manage your tournaments" : "Join thousands of tournament players"}
        </p>
      </div>

      <div className="anim a3" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {mode === "signup" && <Input sz={sz} icon={I.User()} placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
        <Input sz={sz} icon={I.Mail()} placeholder="Email address" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Input sz={sz} icon={I.Lock()} placeholder="Password" togglePw value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      </div>

      {error && <div className="anim" style={{ color: "#dc2626", fontSize: sz.sm, textAlign: "center", marginBottom: 12, fontWeight: 600 }}>{error}</div>}

      <div className="anim a4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Btn primary full sz={sz} onClick={handleSubmit} style={{ opacity: loading ? .7 : 1 }}>
          {loading ? "Signing in..." : mode === "login" ? "Sign In" : "Create Account"}
        </Btn>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: sz.xs, color: "var(--text3)", fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <Btn full sz={sz} onClick={() => API.googleAuth()} style={{ gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </Btn>
      </div>

      <div className="anim a5" style={{ textAlign: "center", marginTop: 24 }}>
        <span style={{ fontSize: sz.sm, color: "var(--text3)" }}>
          {mode === "login" ? "New to Dink? " : "Already have an account? "}
        </span>
        <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ fontSize: sz.sm, color: "var(--green)", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
          {mode === "login" ? "Create account" : "Sign in"}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAYWALL SCREEN
// ════════════════════════════════════════════════════════════
function PaywallScreen({ onSubscribe, sz }) {
  const perks = [
    [I.Trophy, "Unlimited Tournaments", "Track every event & deadline"],
    [I.Users, "Partner Management", "Chemistry scores & smart matching"],
    [I.Chart, "Match Analytics", "Win rates by surface & format"],
    [I.MapPin, "Court Finder", "16,000+ courts with GPS"],
    [I.Zap, "DUPR Auto-Sync", "Ratings sync automatically"],
    [I.Bell, "Smart Alerts", "Never miss a match time"],
  ];
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(170deg,#f0fdf4 0%,#fff 40%,#f9fafb 100%)", fontFamily:"'Nunito',sans-serif", maxWidth:480, margin:"0 auto", padding:"40px 24px" }}>
      <style>{CSS}</style>
      <div className="anim" style={{ textAlign:"center", marginBottom:28 }}>
        <Logo size={64} />
        <h1 style={{ fontWeight:900, fontSize:sz.xxl, color:"var(--text)", marginTop:14 }}>DINK Pro</h1>
        <p style={{ fontSize:sz.base, color:"var(--text2)", marginTop:4 }}>Everything you need for tournament pickleball</p>
      </div>
      <div className="anim a2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
        {perks.map(([ic,t,d],i) => (
          <div key={i} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"16px 14px", boxShadow:"0 1px 3px rgba(0,0,0,.03)" }}>
            <div style={{ color:"var(--green)", marginBottom:8 }}>{ic(24)}</div>
            <div style={{ fontSize:sz.sm, fontWeight:700, color:"var(--text)" }}>{t}</div>
            <div style={{ fontSize:sz.xs, color:"var(--text3)", lineHeight:1.4, marginTop:2 }}>{d}</div>
          </div>
        ))}
      </div>
      {/* Price card */}
      <div className="anim a3" style={{ background:"#fff", border:"2px solid var(--green-bright)", borderRadius:22, padding:"28px 24px", position:"relative", overflow:"hidden", boxShadow:"0 6px 28px rgba(34,197,94,.12)", marginBottom:16 }}>
        <div style={{ position:"absolute", top:0, right:0, background:"var(--green-bright)", color:"#fff", padding:"5px 16px", borderBottomLeftRadius:12, fontSize:11, fontWeight:800, letterSpacing:1 }}>LAUNCH PRICE</div>
        <div style={{ textAlign:"center", marginBottom:4 }}>
          <span style={{ fontSize:sz.xxl+12, fontWeight:900, color:"var(--text)" }}>$9</span>
          <span style={{ fontSize:sz.lg, color:"var(--text3)" }}>/mo</span>
        </div>
        <p style={{ textAlign:"center", fontSize:sz.sm, color:"var(--text3)", marginBottom:2 }}>Full access · Cancel anytime</p>
        <p style={{ textAlign:"center", fontSize:sz.xs, color:"var(--text3)", marginBottom:20 }}>7-day free trial included</p>
        <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:16, marginBottom:20 }}>
          {["Unlimited tournaments & matches","DUPR rating auto-sync","Court finder with GPS","Partner matching & analytics","Push notifications","US & UK support"].map((t,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:24, height:24, borderRadius:7, background:"var(--green-light)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--green)", flexShrink:0 }}>{I.Check(13)}</div>
              <span style={{ fontSize:sz.sm, color:"var(--text)" }}>{t}</span>
            </div>
          ))}
        </div>
        <Btn primary full sz={sz} onClick={onSubscribe}>Start Free Trial →</Btn>
      </div>
      <div className="anim a4" style={{ textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:"var(--text3)", fontSize:sz.xs }}>
        {I.Shield(14)} Secured by Stripe · 256-bit encryption
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════
export default function DinkApp() {
  const [screen, setScreen] = useState("login"); // login | paywall | app
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("tournaments");
  const [region, setRegion] = useState("US");
  const [fontSz, setFontSz] = useState("medium");
  const [showSettings, setShowSettings] = useState(false);
  const [selTourn, setSelTourn] = useState(null);
  const [gear, setGear] = useState(DATA.gear);

  // Check for OAuth/Stripe redirects and existing session on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Google OAuth success — fetch user session from cookie
    if (params.get("auth") === "success") {
      fetch("/api/auth/me")
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            setScreen(data.user.subscribed ? "app" : "paywall");
          }
        })
        .catch(() => {});
      window.history.replaceState({}, "", "/");
    }

    // Stripe payment success
    if (params.get("paid") === "true") {
      const sessionId = params.get("session_id");
      if (sessionId) {
        fetch(`/api/stripe/verify?session_id=${sessionId}`)
          .then(r => r.json())
          .then(data => {
            if (data.active) {
              setUser(prev => prev ? { ...prev, subscribed: true } : prev);
              setScreen("app");
            }
          })
          .catch(() => {});
      }
      window.history.replaceState({}, "", "/");
    }

    // Check existing session (page refresh)
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          setScreen(data.user.subscribed ? "app" : "paywall");
        }
      })
      .catch(() => {});
  }, []);
  const [courtFilt, setCourtFilt] = useState("all");
  const [liveScore, setLiveScore] = useState({ us:[0,0,0], them:[0,0,0], set:1 });
  const [scoring, setScoring] = useState(false);

  const sz = SIZES[fontSz];
  const daysTo = d => Math.ceil((new Date(d)-new Date())/864e5);
  const fmtDate = d => { const dt=new Date(d); return region==="UK" ? dt.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : dt.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); };
  const wr = Math.round(DATA.matches.filter(m=>m.r==="W").length/DATA.matches.length*100);

  if (screen === "login") return <LoginScreen sz={sz} onLogin={u => { setUser(u); setScreen(u.subscribed ? "app" : "paywall"); }} />;
  if (screen === "paywall") return <PaywallScreen sz={sz} onSubscribe={async () => {
    try {
      const res = await API.createCheckout();
      if (res.url) {
        window.location.href = res.url;
      } else {
        // If Stripe isn't configured yet, let them through for testing
        setScreen("app");
      }
    } catch {
      setScreen("app");
    }
  }} />;

  const tabs = [
    { id:"tournaments", lb:"Tourneys", ic:I.Trophy },
    { id:"partners", lb:"Partners", ic:I.Users },
    { id:"matches", lb:"Matches", ic:I.Chart },
    { id:"courts", lb:"Courts", ic:I.MapPin },
    { id:"gear", lb:"Gear", ic:I.Bag },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"'Nunito',sans-serif", maxWidth:480, margin:"0 auto", position:"relative" }}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <header style={{ position:"sticky", top:0, zIndex:50, background:"rgba(255,255,255,.93)", backdropFilter:"blur(14px)", borderBottom:"1px solid var(--border)", padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:"linear-gradient(145deg,#22c55e,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"#fff", boxShadow:"0 3px 10px rgba(34,197,94,.25)" }}>D</div>
          <div>
            <div style={{ fontWeight:900, fontSize:sz.lg, color:"var(--text)", letterSpacing:"-.5px" }}>DINK</div>
            <div style={{ fontSize:10, color:"var(--green)", letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Tournament Manager</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div className="press" onClick={() => setShowSettings(!showSettings)} style={{ width:sz.tap, height:sz.tap, borderRadius:12, border:"1px solid var(--border)", background:showSettings?"var(--green-light)":"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:showSettings?"var(--green)":"var(--text3)" }}>{I.Gear()}</div>
          <div style={{ position:"relative", width:sz.tap, height:sz.tap, borderRadius:12, border:"1px solid var(--border)", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--text3)" }}>
            {I.Bell()}
            <div style={{ position:"absolute", top:8, right:8, width:8, height:8, borderRadius:"50%", background:"#ef4444", border:"2px solid #fff" }} />
          </div>
        </div>
      </header>

      {/* ── SETTINGS ── */}
      {showSettings && (
        <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:18, margin:"10px 16px", padding:22, boxShadow:"0 6px 28px rgba(0,0,0,.06)", animation:"scaleIn .2s ease-out" }}>
          <div style={{ fontSize:sz.lg, fontWeight:800, marginBottom:18, color:"var(--text)" }}>Settings</div>

          {/* User */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 14px", background:"#f9fafb", borderRadius:12, border:"1px solid var(--border)" }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"var(--green-light)", border:"1px solid var(--green-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--green)", fontWeight:800, fontSize:sz.sm }}>{(user?.name||"P")[0]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:sz.sm, fontWeight:700, color:"var(--text)" }}>{user?.name}</div>
              <div style={{ fontSize:sz.xs, color:"var(--text3)" }}>{user?.email}</div>
            </div>
            <div className="press" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); setScreen("login"); setUser(null); }} style={{ cursor:"pointer", color:"var(--text3)" }}>{I.LogOut()}</div>
          </div>

          {/* Region */}
          <div style={{ fontSize:sz.xs, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>Region</div>
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {[["US","🇺🇸","DUPR · USD"],["UK","🇬🇧","UKPA · GBP"]].map(([c,fl,sub]) => (
              <button key={c} className="press" onClick={() => setRegion(c)} style={{ flex:1, padding:12, borderRadius:12, border:`2px solid ${region===c?"var(--green-bright)":"var(--border)"}`, background:region===c?"var(--green-light)":"#fafafa", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"center" }}>
                <div style={{ fontSize:22 }}>{fl}</div>
                <div style={{ fontSize:sz.sm, fontWeight:700, color:"var(--text)", marginTop:2 }}>{c}</div>
                <div style={{ fontSize:10, color:"var(--text3)" }}>{sub}</div>
              </button>
            ))}
          </div>

          {/* Font Size */}
          <div style={{ fontSize:sz.xs, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>Text Size</div>
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {[["small","A","Small"],["medium","A","Medium"],["large","A","Large"]].map(([v,ch,lb]) => (
              <button key={v} className="press" onClick={() => setFontSz(v)} style={{ flex:1, padding:12, borderRadius:12, border:`2px solid ${fontSz===v?"var(--green-bright)":"var(--border)"}`, background:fontSz===v?"var(--green-light)":"#fafafa", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"center" }}>
                <div style={{ fontSize:v==="small"?18:v==="medium"?24:32, fontWeight:800, color:"var(--text)" }}>{ch}</div>
                <div style={{ fontSize:12, color:"var(--text3)" }}>{lb}</div>
              </button>
            ))}
          </div>

          {/* DUPR Connect */}
          <Btn full sz={sz} style={{ background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1d4ed8" }}>
            {I.Zap(18)} Connect DUPR Account
          </Btn>
        </div>
      )}

      {/* ── CONTENT ── */}
      <main style={{ padding:"10px 16px 120px" }}>

        {/* ═══ TOURNAMENTS ═══ */}
        {tab === "tournaments" && <>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
            {[["Upcoming",DATA.tournaments.filter(t=>t.status==="registered").length,"var(--green)"],["Win Rate",wr+"%","#d97706"],[region==="US"?"DUPR":"UKPA",region==="US"?"4.65":"A2","#2563eb"]].map(([l,v,c],i) => (
              <Card key={i} style={{ textAlign:"center", padding:"14px 10px" }}>
                <div style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.stat, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:sz.xs, color:"var(--text3)", fontWeight:600, marginTop:3, textTransform:"uppercase", letterSpacing:.5 }}>{l}</div>
              </Card>
            ))}
          </div>

          {/* Next up */}
          {(() => { const n=DATA.tournaments.filter(t=>t.status==="registered").sort((a,b)=>new Date(a.date)-new Date(b.date))[0]; if(!n) return null; const d=daysTo(n.date); return (
            <div className="anim" style={{ background:"linear-gradient(145deg,#166534,#15803d)", borderRadius:18, padding:22, marginBottom:16, position:"relative", overflow:"hidden", boxShadow:"0 6px 28px rgba(22,101,52,.25)" }}>
              <div style={{ position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,.06)" }}/>
              <div style={{ position:"relative",zIndex:1 }}>
                <div style={{ fontSize:sz.xs, textTransform:"uppercase", letterSpacing:3, color:"#86efac", marginBottom:8, fontWeight:700 }}>Next Tournament</div>
                <div style={{ fontSize:sz.xl, fontWeight:900, color:"#fff", marginBottom:4 }}>{n.name}</div>
                <div style={{ fontSize:sz.sm, color:"#bbf7d0", marginBottom:14 }}>{fmtDate(n.date)} · {n.loc}</div>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ background:"rgba(0,0,0,.2)", borderRadius:12, padding:"10px 16px", fontFamily:"'JetBrains Mono'", fontSize:sz.xl, fontWeight:700, color:"#4ade80" }}>{d}d</div>
                  <div style={{ fontSize:sz.sm, color:"#dcfce7", lineHeight:1.5 }}>
                    <div>Partner: <b>{n.partner}</b></div>
                    <div>{n.fmt} · {n.surface}</div>
                  </div>
                </div>
              </div>
            </div>
          );})()}

          {/* List */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:sz.lg, fontWeight:800 }}>All Tournaments</div>
            <Btn sz={sz} style={{ padding:"8px 14px",fontSize:sz.xs }}>{I.Plus(14)} Add</Btn>
          </div>
          {DATA.tournaments.map(t => { const sc=stColor[t.status]; const d=daysTo(t.date); const sel=selTourn===t.id; return (
            <Card key={t.id} onClick={() => setSelTourn(sel?null:t.id)} style={{ marginBottom:8, borderLeft:`4px solid ${tierC[t.tier]}`, padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:sz.base, fontWeight:700, color:"var(--text)" }}>{t.name}</div>
                  <div style={{ fontSize:sz.sm, color:"var(--text3)", marginTop:2 }}>{fmtDate(t.date)} · {t.loc}</div>
                  <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                    <Tag bg={sc.bg} color={sc.tx} border={sc.bd}>{sc.lb}</Tag>
                    <Tag>{t.fmt}</Tag>
                    <Tag>{t.surface==="Indoor"?I.Home():I.Sun()} {t.surface}</Tag>
                  </div>
                </div>
                <div style={{ textAlign:"right",marginLeft:10 }}>
                  <div style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.lg, fontWeight:700, color:d<=7?"#dc2626":d<=30?"#d97706":"var(--green)" }}>{d>0?d+"d":"Today!"}</div>
                  <div style={{ fontSize:sz.xs, color:"var(--text3)" }}>until event</div>
                </div>
              </div>
              {sel && (
                <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #f1f5f9", animation:"fadeUp .2s ease-out" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14, fontSize:sz.sm }}>
                    <div><span style={{ color:"var(--text3)" }}>Partner: </span><b>{t.partner}</b></div>
                    <div><span style={{ color:"var(--text3)" }}>Tier: </span><b style={{ color:tierC[t.tier] }}>{t.tier}</b></div>
                    <div><span style={{ color:"var(--text3)" }}>Deadline: </span><b>{fmtDate(t.dl)}</b></div>
                    <div><span style={{ color:"var(--text3)" }}>Fee: </span><b>{t.fee}</b></div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {t.status==="open" && <Btn primary full sz={sz}>Register Now</Btn>}
                    <Btn full sz={sz}>Trip Details</Btn>
                  </div>
                </div>
              )}
            </Card>
          );})}
        </>}

        {/* ═══ PARTNERS ═══ */}
        {tab === "partners" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:sz.lg, fontWeight:800 }}>My Partners</div>
            <Btn sz={sz} style={{ padding:"8px 14px",fontSize:sz.xs }}>{I.Plus(14)} Add</Btn>
          </div>
          {DATA.partners.map((p,i) => { const ac=accents[i%5]; return (
            <Card key={p.id} style={{ marginBottom:8, padding:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:sz.tap+4, height:sz.tap+4, borderRadius:14, background:`${ac}15`, border:`2px solid ${ac}30`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'JetBrains Mono'", fontWeight:700, fontSize:sz.sm, color:ac }}>{p.av}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:sz.base, fontWeight:700 }}>{p.name}</span>
                    <Tag style={{ fontSize:10 }}>{p.type}</Tag>
                  </div>
                  <div style={{ fontSize:sz.sm, color:"var(--text3)", marginTop:2 }}>{p.avail} · {p.m} matches</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.xl, fontWeight:700, color:"var(--green)" }}>{p.dupr}</div>
                  <div style={{ fontSize:sz.xs, color:"var(--text3)" }}>{region==="US"?"DUPR":"Rating"}</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14, paddingTop:14, borderTop:"1px solid #f1f5f9" }}>
                {[["Win Rate",p.wr+"%",p.wr>=70?"var(--green)":p.wr>=60?"#d97706":"#dc2626"],["Chemistry",p.chem,"#7c3aed"],["Matches",p.m,"var(--text)"]].map(([l,v,c],j) => (
                  <div key={j} style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.lg, fontWeight:700, color:c }}>{v}</div>
                    <div style={{ fontSize:sz.xs, color:"var(--text3)", textTransform:"uppercase" }}>{l}</div>
                  </div>
                ))}
              </div>
              <Btn full sz={sz} style={{ marginTop:12, background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1d4ed8" }}>
                {I.Phone(16)} Message {p.name.split(" ")[0]}
              </Btn>
            </Card>
          );})}
          {/* AI suggestion */}
          <div className="anim" style={{ background:"linear-gradient(145deg,#eff6ff,#f5f3ff)", border:"1px solid #c7d2fe", borderRadius:16, padding:18, marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>{I.Target(20)}<span style={{ fontSize:sz.base, fontWeight:700, color:"#3730a3" }}>Smart Partner Match</span></div>
            <div style={{ fontSize:sz.sm, color:"var(--text2)", lineHeight:1.5 }}>Based on your 4.65 DUPR, <b style={{ color:"var(--text)" }}>Priya Kapoor</b> (5.1) is your best mixed doubles option for the APP Chicago Open.</div>
          </div>
        </>}

        {/* ═══ MATCHES ═══ */}
        {tab === "matches" && <>
          {/* Live scoring */}
          <Card style={{ marginBottom:16, border:scoring?"2px solid #fca5a5":"1px solid var(--border)", background:scoring?"#fef2f2":"#fff" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:scoring?18:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {scoring && <div style={{ width:10,height:10,borderRadius:"50%",background:"#ef4444",animation:"pulse 1.5s ease-in-out infinite" }}/>}
                <span style={{ fontSize:sz.lg, fontWeight:800, color:scoring?"#dc2626":"var(--text)" }}>{scoring?"LIVE MATCH":"Score Entry"}</span>
              </div>
              <Btn primary={!scoring} sz={sz} onClick={() => { setScoring(!scoring); setLiveScore({us:[0,0,0],them:[0,0,0],set:1}); }} style={scoring?{background:"#fee2e2",color:"#dc2626",boxShadow:"none",border:"1px solid #fecaca"}:{}}>
                {scoring?"End":"Start Match"}
              </Btn>
            </div>
            {scoring && (
              <div style={{ animation:"fadeUp .25s ease-out" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:16, alignItems:"center", marginBottom:16 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:sz.sm, color:"var(--text3)", fontWeight:700, marginBottom:4 }}>US</div>
                    <div style={{ fontFamily:"'JetBrains Mono'", fontSize:48, fontWeight:700, color:"var(--green)" }}>{liveScore.us[liveScore.set-1]}</div>
                    <button className="press" onClick={() => { const n=[...liveScore.us]; n[liveScore.set-1]++; setLiveScore({...liveScore,us:n}); }} style={{ marginTop:8,width:sz.tap+16,height:sz.tap,borderRadius:12,border:"2px solid var(--green-border)",background:"var(--green-light)",color:"var(--green)",fontSize:24,fontWeight:800,cursor:"pointer" }}>+</button>
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.sm, color:"var(--text3)", padding:"6px 12px", borderRadius:8, background:"#f9fafb", border:"1px solid var(--border)" }}>Set {liveScore.set}</div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:sz.sm, color:"var(--text3)", fontWeight:700, marginBottom:4 }}>THEM</div>
                    <div style={{ fontFamily:"'JetBrains Mono'", fontSize:48, fontWeight:700, color:"#dc2626" }}>{liveScore.them[liveScore.set-1]}</div>
                    <button className="press" onClick={() => { const n=[...liveScore.them]; n[liveScore.set-1]++; setLiveScore({...liveScore,them:n}); }} style={{ marginTop:8,width:sz.tap+16,height:sz.tap,borderRadius:12,border:"2px solid #fecaca",background:"#fef2f2",color:"#dc2626",fontSize:24,fontWeight:800,cursor:"pointer" }}>+</button>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                  {[1,2,3].map(s => (
                    <button key={s} className="press" onClick={() => setLiveScore({...liveScore,set:s})} style={{ padding:"6px 18px",borderRadius:8,border:`2px solid ${liveScore.set===s?"var(--green-bright)":"var(--border)"}`,background:liveScore.set===s?"var(--green-light)":"#fff",color:liveScore.set===s?"var(--green)":"var(--text3)",fontSize:sz.sm,fontWeight:600,cursor:"pointer" }}>Set {s}</button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div style={{ fontSize:sz.lg, fontWeight:800, marginBottom:12 }}>Match History</div>
          {DATA.matches.map(m => (
            <Card key={m.id} style={{ marginBottom:8, borderLeft:`4px solid ${m.r==="W"?"#22c55e":"#ef4444"}`, padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:sz.base, fontWeight:700 }}>vs {m.opp}</div>
                  <div style={{ fontSize:sz.sm, color:"var(--text3)", marginTop:3 }}>{m.tourn}</div>
                  <div style={{ fontSize:sz.sm, color:"var(--text3)" }}>{fmtDate(m.date)} · w/ {m.partner}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.lg, fontWeight:700, color:m.r==="W"?"var(--green)":"#dc2626", background:m.r==="W"?"var(--green-light)":"#fef2f2", padding:"3px 10px", borderRadius:8 }}>{m.r==="W"?"WIN":"LOSS"}</div>
                  <div style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.sm, color:"var(--text3)", marginTop:4 }}>{m.score}</div>
                </div>
              </div>
            </Card>
          ))}

          {/* Analytics */}
          <Card style={{ marginTop:8 }}>
            <div style={{ fontSize:sz.base, fontWeight:700, marginBottom:12 }}>Quick Analytics</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["Indoor Win %","75%","var(--green)"],["Outdoor Win %","60%","#d97706"],["Best Partner","Alex R.","#7c3aed"],["3-Set Record","2-1","#ea580c"]].map(([l,v,c],i) => (
                <div key={i} style={{ background:"#f9fafb", borderRadius:12, padding:14, textAlign:"center", border:"1px solid #f1f5f9" }}>
                  <div style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.xl, fontWeight:700, color:c }}>{v}</div>
                  <div style={{ fontSize:sz.xs, color:"var(--text3)", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </>}

        {/* ═══ COURTS ═══ */}
        {tab === "courts" && <>
          <div style={{ fontSize:sz.lg, fontWeight:800, marginBottom:12 }}>Find Courts</div>
          <div style={{ display:"flex", gap:8, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
            {["all","indoor","outdoor","sanctioned"].map(fl => (
              <button key={fl} className="press" onClick={() => setCourtFilt(fl)} style={{ padding:`8px 16px`, borderRadius:10, border:`2px solid ${courtFilt===fl?"var(--green-bright)":"var(--border)"}`, background:courtFilt===fl?"var(--green-light)":"#fff", color:courtFilt===fl?"var(--green)":"var(--text3)", fontSize:sz.sm, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Nunito'", textTransform:"capitalize" }}>{fl}</button>
            ))}
          </div>
          {DATA.courts.filter(c => courtFilt==="indoor"?c.indoor:courtFilt==="outdoor"?!c.indoor:courtFilt==="sanctioned"?c.sanc:true).map(c => (
            <Card key={c.id} style={{ marginBottom:8, padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontSize:sz.base, fontWeight:700 }}>{c.name}</span>
                    {c.sanc && <Tag bg="var(--green-light)" color="var(--green)" border="var(--green-border)" style={{ fontSize:10 }}>✓ SANCTIONED</Tag>}
                  </div>
                  <div style={{ fontSize:sz.sm, color:"var(--text3)", marginBottom:8 }}>{c.addr}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Tag>{c.indoor?I.Home():I.Sun()} {c.indoor?"Indoor":"Outdoor"}</Tag>
                    <Tag>{c.surface}</Tag>
                    <Tag>{c.courts} courts</Tag>
                    {c.lit && <Tag bg="#fffbeb" color="#d97706" border="#fde68a">💡 Lit</Tag>}
                  </div>
                </div>
                <div style={{ textAlign:"right", marginLeft:12, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:3, justifyContent:"flex-end", color:"#eab308" }}>{I.Star()}<span style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.base, fontWeight:700, color:"#92400e" }}>{c.rate}</span></div>
                  <div style={{ fontSize:sz.sm, color:"var(--text3)", marginTop:2 }}>{c.dist}</div>
                </div>
              </div>
              <Btn full sz={sz} style={{ marginTop:12, background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1d4ed8" }}>
                {I.MapPin(16)} Navigate · {c.dist}
              </Btn>
            </Card>
          ))}
        </>}

        {/* ═══ GEAR ═══ */}
        {tab === "gear" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:sz.lg, fontWeight:800 }}>Tournament Bag</div>
            <span style={{ fontFamily:"'JetBrains Mono'", fontSize:sz.sm, color:"var(--green)", fontWeight:700 }}>{gear.filter(g=>g.c).length}/{gear.length}</span>
          </div>
          <div style={{ height:10, borderRadius:5, background:"#f1f5f9", marginBottom:18, overflow:"hidden", border:"1px solid var(--border)" }}>
            <div style={{ height:"100%", borderRadius:5, width:`${gear.filter(g=>g.c).length/gear.length*100}%`, background:"linear-gradient(90deg,#22c55e,#4ade80)", transition:"width .3s" }}/>
          </div>
          {["Equipment","Apparel","Nutrition","Other"].map(cat => (
            <div key={cat} style={{ marginBottom:16 }}>
              <div style={{ fontSize:sz.xs, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>{cat}</div>
              {gear.filter(g=>g.cat===cat).map(g => (
                <div key={g.id} className="lift" onClick={() => setGear(p=>p.map(x=>x.id===g.id?{...x,c:!x.c}:x))} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderRadius:12, marginBottom:5, cursor:"pointer", background:g.c?"var(--green-light)":"#fff", border:`1px solid ${g.c?"var(--green-border)":"var(--border)"}`, transition:"all .2s" }}>
                  <div style={{ width:sz.tap*.55, height:sz.tap*.55, borderRadius:8, flexShrink:0, border:`2px solid ${g.c?"var(--green-bright)":"#d1d5db"}`, background:g.c?"var(--green-bright)":"#fff", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", transition:"all .2s" }}>
                    {g.c && I.Check(14)}
                  </div>
                  <span style={{ fontSize:sz.base, fontWeight:500, color:g.c?"#166534":"var(--text2)", textDecoration:g.c?"line-through":"none" }}>{g.item}</span>
                </div>
              ))}
            </div>
          ))}
        </>}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, zIndex:50, background:"rgba(255,255,255,.95)", backdropFilter:"blur(14px)", borderTop:"1px solid var(--border)", padding:"8px 6px", paddingBottom:"max(8px, env(safe-area-inset-bottom))", display:"flex", justifyContent:"space-around" }}>
        {tabs.map(t => { const a=tab===t.id; return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:a?"var(--green-light)":"none", border:"none", cursor:"pointer", padding:`8px ${sz.tap*.3}px`, borderRadius:12, color:a?"var(--green)":"#9ca3af", transition:"all .2s", minWidth:sz.tap+12 }}>
            {t.ic(a?24:22)}
            <span style={{ fontSize:sz.nav, fontWeight:a?800:500 }}>{t.lb}</span>
          </button>
        );})}
      </nav>
    </div>
  );
}
