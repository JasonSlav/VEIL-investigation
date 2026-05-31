import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  MessageSquare,
  FileText,
  CreditCard,
  Globe,
  User,
  Mail,
  Phone,
  Search,
  Activity,
  Link2,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  X,
  Send,
  Zap,
  Lock,
  Eye,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = "init" | "case-select" | "investigation";
type ClueStatus = "unread" | "read" | "analyzed" | "intel-added";
type HintTier = 1 | 2 | 3 | 4;

interface BilingualText {
  en: string;
  id: string;
}

interface Clue {
  id: string;
  icon: React.ReactNode;
  iconString?: string;
  title: BilingualText;
  preview: BilingualText;
  fullContent: BilingualText;
  status: ClueStatus;
  selected: boolean;
  category: BilingualText;
  timestamp: string;
  nodeId?: string;
  isInitial?: boolean;
  unlocks?: string[];
  isNew?: boolean;
}

interface ClueFromJSON extends Omit<Clue, 'icon' | 'title' | 'preview' | 'fullContent' | 'category'> {
  icon: string;
  title: BilingualText;
  preview: BilingualText;
  fullContent: BilingualText;
  category: BilingualText;
}

interface GraphNode {
  id: string;
  label: BilingualText;
  x: number;
  y: number;
  isActive: boolean;
  color: string;
}

interface GraphEdge {
  from: string;
  to: string;
  type: "user" | "oracle";
  label?: BilingualText;
}

interface OracleMsg {
  text: BilingualText;
  time: string;
  type: "intel" | "hint" | "warn" | "success";
}

interface LogEntry {
  text: BilingualText;
  time: string;
  type: "discovery" | "intel" | "hint" | "warning";
}

interface CaseData {
  id: string;
  caseNum: string;
  title: BilingualText;
  teaser: BilingualText;
  description: BilingualText;
  difficulty: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: { en: string; id: string };
  emoji: string;
  narrative: BilingualText;
  clues: Clue[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  validEdges: [string, string][];
  failureClues: { text: BilingualText; relatedClueId: string; targetNodeId: string }[];
  correctAnswer: { scamType: string; threatLevel: string };
  educationalExplanation: BilingualText;
  correctScamType: string;
  correctThreatLevel: string;
  educationReport: {
    scamMethod: BilingualText;
    redFlags: BilingualText[];
    preventionTips: BilingualText[];
  };
  oracleHints: Record<1 | 2 | 3, BilingualText>;
  wrongAnswerClue: Clue;
  wrongAnswerNode: GraphNode;
}

interface CaseDataFromJSON extends Omit<CaseData, 'clues' | 'wrongAnswerClue'> {
  clues: ClueFromJSON[];
  wrongAnswerClue: ClueFromJSON;
}

// ─── Constants & UI Text ─────────────────────────────────────────────────────

const SCAM_TYPES = [
  { en: "Select scam type…", id: "Pilih jenis penipuan…" },
  { en: "Ponzi / Investment Fraud", id: "Ponzi / Penipuan Investasi" },
  { en: "Job / Recruitment Scam", id: "Penipuan Lowongan Kerja" },
  { en: "Phishing / Identity Theft", id: "Phishing / Pencurian Identitas" },
  { en: "Romance Scam", id: "Penipuan Romansa" },
  { en: "E-commerce Fraud", id: "Penipuan E-commerce" }
];

const THREAT_LEVELS = [
  { en: "Select threat level…", id: "Pilih tingkat ancaman…" },
  { en: "Low", id: "Rendah" },
  { en: "Medium", id: "Sedang" },
  { en: "High", id: "Tinggi" },
  { en: "Critical", id: "Kritis" }
];

const UI_TEXT = {
  en: {
    files: "← BACK TO FILES",
    evidence: "CASE EVIDENCE",
    analyze: "Analyze Connection",
    live: "LIVE",
    scamType: "SCAM TYPE",
    threat: "THREAT LEVEL",
    clear: "CLEAR SELECTION",
    log: "INVESTIGATION LOG",
    new: "NEW",
    reset: "RESET CASE",
    inspect: "INSPECT",
    select: "SELECT",
    selected: "✓ SELECTED",
    analyzed: "FILES ANALYZED",
    submit: "Submit Conclusion",
    submitting: "Processing…",
    submitted: "✓ Submitted",
    retry: "✗ Incorrect — Retry",
    oracle: "ORACLE // COMMUNICATION",
    oracleLive: "INTELLIGENCE FEED — LIVE",
    requestIntel: "Request Intel",
    exhausted: "Intel Exhausted",
    remaining: "REMAINING",
    emptyState: "Select evidence and analyze relationships",
    loading: "LOADING INVESTIGATION FILES...",
    next: "NEXT INVESTIGATION FILE",
    caseClosed: "CASE CLOSED — INTEL REPORT",
    debrief: "Investigation complete. Debrief follows.",
    scamMethod: "SCAM METHOD",
    redFlags: "RED FLAGS IDENTIFIED",
    prevention: "PREVENTION PROTOCOL",
    evidenceFile: "EVIDENCE FILE",
    logged: "LOGGED",
    clickToClose: "CLICK OUTSIDE TO CLOSE",
    filesLabel: "FILES",
    selectedLabel: "SELECTED",
    pctAnalyzed: "ANALYZED",
    caseLabel: "CASE",
    alreadyEstablished: "This connection has already been established.",
    resetTitle: "SYSTEM RESET INITIATED",
    resetMsg: "Clear all investigation progress for this case? This operation is irreversible.",
    confirmBtn: "CONFIRM RESET",
    cancelBtn: "CANCEL",
    statusUnread: "UNREAD",
    statusRead: "READ",
    statusAnalyzed: "ANALYZED",
    statusIntel: "INTEL ADDED",
    diffLow: "LOW",
    diffMedium: "MEDIUM",
    diffHigh: "HIGH",
    diffCritical: "CRITICAL",
  },
  id: {
    files: "← KEMBALI KE BERKAS",
    evidence: "BUKTI KASUS",
    analyze: "Analisis Hubungan",
    live: "LANGSUNG",
    scamType: "JENIS PENIPUAN",
    threat: "TINGKAT ANCAMAN",
    clear: "BERSIHKAN SELEKSI",
    log: "LOG INVESTIGASI",
    new: "BARU",
    reset: "RESET KASUS",
    inspect: "PERIKSA",
    select: "PILIH",
    selected: "✓ TERPILIH",
    analyzed: "BERKAS DIANALISIS",
    submit: "Kirim Kesimpulan",
    submitting: "Memproses…",
    submitted: "✓ Terkirim",
    retry: "✗ Salah — Coba Lagi",
    oracle: "ORACLE // KOMUNIKASI",
    oracleLive: "UMPAN INTELIJEN — AKTIF",
    requestIntel: "Minta Intel",
    exhausted: "Intel Habis",
    remaining: "TERSISA",
    emptyState: "Pilih bukti dan analisis hubungannya",
    loading: "MEMUAT BERKAS INVESTIGASI...",
    next: "BERKAS INVESTIGASI BERIKUTNYA",
    caseClosed: "KASUS DITUTUP — LAPORAN INTEL",
    debrief: "Investigasi selesai. Berikut ringkasannya.",
    scamMethod: "METODE PENIPUAN",
    redFlags: "TANDA-TANDA MENCURIGAKAN",
    prevention: "PROTOKOL PENCEGAHAN",
    evidenceFile: "BERKAS BUKTI",
    logged: "DICATAT",
    clickToClose: "KLIK DI LUAR UNTUK MENUTUP",
    filesLabel: "BERKAS",
    selectedLabel: "TERPILIH",
    pctAnalyzed: "DIANALISIS",
    caseLabel: "KASUS",
    alreadyEstablished: "Hubungan ini sudah terbentuk.",
    resetTitle: "INISIALISASI RESET SISTEM",
    resetMsg: "Hapus semua kemajuan investigasi untuk kasus ini? Operasi ini tidak dapat dibatalkan.",
    confirmBtn: "KONFIRMASI RESET",
    cancelBtn: "BATAL",
    statusUnread: "BELUM DIBACA",
    statusRead: "SUDAH DIBACA",
    statusAnalyzed: "DIANALISIS",
    statusIntel: "INTEL DITAMBAH",
    diffLow: "RENDAH",
    diffMedium: "SEDANG",
    diffHigh: "TINGGI",
    diffCritical: "KRITIS",
  },
};

const iconMap: Record<string, any> = {
  MessageSquare, FileText, CreditCard, Globe, User, Mail, Phone, Search, Activity, Shield
};

const now = () => new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// ─── Micro UI ─────────────────────────────────────────────────────────────────

function StatusLabel({ status, lang }: { status: ClueStatus; lang: "en" | "id" }) {
  const map = {
    unread: "text-[#ff9f43]",
    read: "text-[#888]",
    analyzed: "text-[#cc0000]",
    "intel-added": "text-[#ff9f43]",
  };
  const labels = { 
    unread: UI_TEXT[lang].statusUnread, 
    read: UI_TEXT[lang].statusRead, 
    analyzed: UI_TEXT[lang].statusAnalyzed, 
    "intel-added": UI_TEXT[lang].statusIntel 
  };
  return (
    <span className={`text-[9px] font-mono font-semibold tracking-[0.15em] ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

function DiffBadge({ level, lang }: { level: string; lang: "en" | "id" }) {
  const map: Record<string, string> = {
    LOW: "text-[#4ade80] border-[#4ade80]/30",
    MEDIUM: "text-[#ff9f43] border-[#ff9f43]/30",
    HIGH: "text-[#ff4040] border-[#ff4040]/30",
    CRITICAL: "text-[#cc0000] border-[#cc0000]/30",
  };
  const labels: Record<string, string> = {
    LOW: UI_TEXT[lang].diffLow,
    MEDIUM: UI_TEXT[lang].diffMedium,
    HIGH: UI_TEXT[lang].diffHigh,
    CRITICAL: UI_TEXT[lang].diffCritical,
  };
  return (
    <span className={`text-[9px] font-mono font-bold tracking-[0.15em] border px-1.5 py-0.5 rounded ${map[level] || "text-[#888] border-[#888]/30"}`}>
      {labels[level] || level}
    </span>
  );
}

const getIcon = (name: string) => {
  const Icon = iconMap[name] || Shield;
  return <Icon size={14} />;
};

// ─── Screen 0 — Initialization ────────────────────────────────────────────────

function InitializationScreen({ onSelect }: { onSelect: (l: "en" | "id") => void }) {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-20" 
           style={{ backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 2px, 3px 100%" }} />
      
      <div className="z-10 flex flex-col items-center max-w-md w-full">
        <div className="mb-12 relative text-center">
          <div className="w-16 h-16 bg-[#cc0000] flex items-center justify-center shadow-[0_0_40px_rgba(204,0,0,0.4)] mb-6 mx-auto"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-6xl font-black tracking-[0.5em] text-white ml-[0.5em]" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>VEIL</h1>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#cc0000] to-transparent w-full" />
        </div>

        <div className="space-y-4 w-full">
          <p className="text-[10px] font-mono text-[#444] tracking-[0.4em] text-center mb-6 uppercase">Select System Protocol</p>
          
          <button
            onClick={() => onSelect("en")}
            className="w-full group relative py-4 border border-[rgba(255,255,255,0.06)] bg-[#0d0d0d] hover:border-[#cc0000]/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between px-6">
              <div className="text-left">
                <p className="text-[9px] font-mono text-[#cc0000] tracking-widest mb-1">PROTOCOL // 01</p>
                <p className="text-white font-bold tracking-widest group-hover:text-[#ff4040]">ENGLISH LANGUAGE</p>
              </div>
              <ChevronRight size={16} className="text-[#222] group-hover:text-[#cc0000] group-hover:translate-x-1 transition-all" />
            </div>
          </button>

          <button
            onClick={() => onSelect("id")}
            className="w-full group relative py-4 border border-[rgba(255,255,255,0.06)] bg-[#0d0d0d] hover:border-[#cc0000]/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between px-6">
              <div className="text-left">
                <p className="text-[9px] font-mono text-[#cc0000] tracking-widest mb-1">PROTOKOL // 02</p>
                <p className="text-white font-bold tracking-widest group-hover:text-[#ff4040]">BAHASA INDONESIA</p>
              </div>
              <ChevronRight size={16} className="text-[#222] group-hover:text-[#cc0000] group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>

        <div className="mt-16 text-center">
          <p className="text-[8px] font-mono text-[#222] tracking-[0.5em] animate-pulse uppercase">
            Establishing Secure Handshake...
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 1 — Case Selection ────────────────────────────────────────────────

function CaseSelectScreen({ cases, onSelect, lang, setLang }: { cases: CaseData[]; onSelect: (id: string) => void; lang: "en" | "id"; setLang: (l: "en" | "id") => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const t = {
    en: {
      subtitle: "Reveal hidden patterns. Solve digital deception.",
      status: "SYSTEM ONLINE — SECURE CONNECTION ESTABLISHED",
      titleFiles: "LATEST INCIDENT REPORTS — ANALYZE TO START",
      cluesCount: "EVIDENCE FILES",
      selected: "FILE SELECTED ›",
      toSelect: "CLICK TO SELECT",
      btnOpen: "OPEN INVESTIGATION FILE",
      footer: "VEIL INTELLIGENCE PLATFORM · CLASSIFIED · AUTHORIZED USE ONLY"
    },
    id: {
      subtitle: "Ungkap pola tersembunyi. Selesaikan penipuan digital.",
      status: "SISTEM ONLINE — KONEKSI AMAN TERBENTUK",
      titleFiles: "LAPORAN INSIDEN TERBARU — ANALISIS UNTUK MEMULAI",
      cluesCount: "BERKAS BUKTI",
      selected: "BERKAS DIPILIH ›",
      toSelect: "KLIK UNTUK MEMILIH",
      btnOpen: "BUKA BERKAS INVESTIGASI",
      footer: "VEIL INTELLIGENCE PLATFORM · RAHASIA · HANYA UNTUK PENGGUNA BERIZIN"
    }
  }[lang];

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)",
          backgroundSize: "100% 4px",
        }}
      />

      <div className="mb-12 text-center z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#cc0000] flex items-center justify-center" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-4xl font-bold tracking-[0.5em] text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            VEIL
          </span>
        </div>
        <p className="text-[#555] text-xs font-mono tracking-[0.2em] uppercase">
          {t.subtitle}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 border border-[#cc0000]/30 px-3 py-1">
          <span className="w-1.5 h-1.5 bg-[#cc0000] rounded-full animate-pulse" />
          <span className="text-[9px] font-mono text-[#cc0000] tracking-widest">{t.status}</span>
        </div>
      </div>

      <div className="w-full max-w-4xl z-10">
        <p className="text-[9px] font-mono text-[#444] tracking-[0.3em] uppercase mb-4 text-center border-b border-[rgba(255,255,255,0.05)] pb-3">
          {t.titleFiles}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {cases.map((c) => {
            const isChosen = chosen === c.id;
            const isHov = hovered === c.id;
            return (
              <div
                key={c.id}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setChosen(c.id)}
                className="cursor-pointer"
                style={{ transform: isHov || isChosen ? "scale(1.015)" : "scale(1)", transition: "transform 250ms ease" }}
              >
                <div className={`border relative overflow-hidden transition-all duration-300 ${
                  isChosen
                    ? "border-[#cc0000] bg-[#0f0000] shadow-[0_0_30px_rgba(204,0,0,0.2)]"
                    : isHov
                    ? "border-[rgba(204,0,0,0.4)] bg-[#0d0d0d]"
                    : "border-[rgba(255,255,255,0.07)] bg-[#0d0d0d]"
                }`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 transition-colors duration-300 ${isChosen ? "bg-[#cc0000]" : "bg-transparent"}`} />
                  {isChosen && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#cc0000] to-transparent" />}

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[9px] font-mono text-[#444] tracking-widest mb-1">{c.caseNum} // INCIDENT REPORT</p>
                        <h2 className="text-white font-bold text-base tracking-wide" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{c.title[lang]}</h2>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-2xl">{c.emoji}</span>
                      </div>
                    </div>
                    <p className="text-[#555] text-xs leading-relaxed mb-4 italic">"{c.teaser[lang]}"</p>
                    <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.05)]">
                      <span className="text-[9px] font-mono text-[#333]">{c.clues.length} {t.cluesCount}</span>
                      {isChosen
                        ? <span className="text-[9px] font-mono text-[#cc0000] tracking-wider">{t.selected}</span>
                        : <span className="text-[9px] font-mono text-[#333]">{t.toSelect}</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => chosen && onSelect(chosen)}
            disabled={!chosen}
            className={`px-8 py-3 font-bold text-sm transition-all duration-300 flex items-center gap-3 ${
              chosen
                ? "bg-[#cc0000] text-white hover:bg-[#ff0000] shadow-[0_0_20px_rgba(204,0,0,0.4)]"
                : "border border-[rgba(255,255,255,0.1)] text-[#333] cursor-not-allowed"
            }`}
          >
            {t.btnOpen} <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="mt-12 z-10 flex flex-col items-center gap-3">
        <p className="text-[8px] font-mono text-[#333] tracking-[0.3em] uppercase">System Protocol</p>
        <div className="flex items-center bg-[#0d0d0d] border border-[rgba(255,255,255,0.06)] p-1 rounded-sm">
          <button 
            onClick={() => setLang("en")}
            className={`px-4 py-1.5 text-[10px] font-bold tracking-widest transition-all duration-300 ${
              lang === "en" ? "bg-[#cc0000] text-white shadow-[0_0_10px_rgba(204,0,0,0.2)]" : "text-[#444] hover:text-[#888]"
            }`}
          > ENGLISH
          </button>
          <button 
            onClick={() => setLang("id")}
            className={`px-4 py-1.5 text-[10px] font-bold tracking-widest transition-all duration-300 ${
              lang === "id" ? "bg-[#cc0000] text-white shadow-[0_0_10px_rgba(204,0,0,0.2)]" : "text-[#444] hover:text-[#888]"
            }`}
          > INDONESIA
          </button>
        </div>
      </div>

      <p className="mt-8 text-[#222] text-[9px] font-mono tracking-[0.3em] z-10">
        {t.footer}
      </p>
    </div>
  );
}

// ─── SVG Graph ───────────────────────────────────────────────────────────────

function InvestigationGraph({ nodes, edges, lang }: { nodes: GraphNode[]; edges: GraphEdge[]; lang: "en" | "id" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 500, h: 280 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const px = (pct: number, total: number) => (pct / 100) * total;

  return (
    <div ref={ref} className="w-full h-full">
      <svg width={size.w} height={size.h} style={{ fontFamily: "'JetBrains Mono',monospace" }}>
        <defs>
          <filter id="glow-r">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="arr-u" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill="#4ade80" />
          </marker>
          <marker id="arr-o" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill="#ff9f43" />
          </marker>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={size.w} height={size.h} fill="url(#grid)" />

        {edges.map((e, i) => {
          const f = nodes.find((n) => n.id === e.from);
          const t = nodes.find((n) => n.id === e.to);
          if (!f || !t) return null;
          const x1 = px(f.x, size.w), y1 = px(f.y, size.h);
          const x2 = px(t.x, size.w), y2 = px(t.y, size.h);
          const color = e.type === "user" ? "#4ade80" : "#ff9f43";
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5"
                strokeOpacity="0.6" strokeDasharray={e.type === "oracle" ? "4 3" : "none"}
                markerEnd={`url(#arr-${e.type === "user" ? "u" : "o"})`} />
              {e.label && (
                <text x={(x1+x2)/2} y={(y1+y2)/2 - 6} textAnchor="middle" fontSize="8"
                  fill={color} opacity="0.7">{e.label[lang]}</text>
              )}
            </g>
          );
        })}

        {nodes.map((n) => {
          const cx = px(n.x, size.w), cy = px(n.y, size.h);
          return (
            <g key={n.id} filter={n.isActive ? "url(#glow-r)" : undefined}>
              {n.isActive && <circle cx={cx} cy={cy} r={16} fill="none" stroke={n.color} strokeWidth="1" strokeOpacity="0.2" />}
              <circle cx={cx} cy={cy} r={n.isActive ? 9 : 7}
                fill={n.color} fillOpacity={n.isActive ? 0.9 : 0.5}
                stroke={n.color} strokeWidth={n.isActive ? 2 : 1} strokeOpacity={n.isActive ? 1 : 0.3} />
              <text x={cx} y={cy + 20} textAnchor="middle" fontSize="8.5" fill="#666">{n.label[lang]}</text>
            </g>
          );
        })}

        {/* Dynamic Empty State Check */}
        {edges.filter(e => e.type === "user").length === 0 && nodes.every(n => !n.isActive) && (
          <text x={size.w / 2} y={size.h / 2} textAnchor="middle" fontSize="11"
            fill="#333" fontFamily="'JetBrains Mono',monospace">
            {UI_TEXT[lang].emptyState}
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── Evidence Card ────────────────────────────────────────────────────────────

function EvidenceCard({ clue, onInspect, onToggle, lang }: { clue: Clue; onInspect: () => void; onToggle: () => void; lang: "en" | "id" }) {
  return (
    <div
      onClick={() => { if (clue.isNew) onToggle(); }}
      className={`relative border-l-2 transition-all duration-250 cursor-pointer group ${
        clue.selected
          ? "border-l-[#cc0000] bg-[#0f0000]"
          : clue.status === "analyzed"
          ? "border-l-[#ff9f43] bg-[#111111]"
          : clue.isNew
          ? "border-l-[#cc0000] bg-[#1a0000] animate-pulse"
          : clue.status === "unread"
          ? "border-l-[#333] bg-[#0d0d0d] hover:border-l-[#555] hover:bg-[#111]"
          : "border-l-[#2a2a2a] bg-[#0d0d0d] hover:bg-[#111]"
      }`}
      style={{ borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0 }}
    >
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
            clue.selected ? "text-[#cc0000]" : clue.status === "analyzed" ? "text-[#ff9f43]" : clue.isNew ? "text-[#ff4040]" : "text-[#444]"
          }`}>
            {clue.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <p className={`text-xs font-medium leading-snug truncate ${
                clue.isNew ? "text-[#ff4040]" : clue.status === "unread" ? "text-[#999]" : "text-[#ccc]"
              }`} style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                {clue.isNew && <span className="mr-1.5 text-[8px] bg-[#cc0000] text-white px-1 py-0 rounded-sm">{UI_TEXT[lang].new}</span>}
                {clue.title[lang]}
              </p>
              <StatusLabel status={clue.status} lang={lang} />
            </div>
            <p className="text-[11px] text-[#555] leading-snug line-clamp-2 mt-0.5">{clue.preview[lang]}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[8px] font-mono text-[#333] tracking-wider">{clue.category[lang]}</span>
              <span className="text-[8px] font-mono text-[#333]">{clue.timestamp}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-2.5 border-t border-[rgba(255,255,255,0.04)] pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onInspect(); }}
            className="flex-1 py-1 text-[9px] font-mono tracking-wider bg-[#151515] text-[#555] hover:text-[#ccc] hover:bg-[#1e1e1e] transition-colors border border-[rgba(255,255,255,0.04)]"
          >
            {UI_TEXT[lang].inspect}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`flex-1 py-1 text-[9px] font-mono tracking-wider transition-colors border ${
              clue.selected
                ? "bg-[#cc0000]/20 text-[#ff4040] border-[#cc0000]/40"
                : "bg-[#151515] text-[#555] hover:text-[#cc0000] hover:border-[#cc0000]/30 border-[rgba(255,255,255,0.04)]"
            }`}
          >
            {clue.selected ? UI_TEXT[lang].selected : UI_TEXT[lang].select}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Clue Modal ───────────────────────────────────────────────────────────────

function ClueModal({ clue, onClose, lang }: { clue: Clue; onClose: () => void; lang: "en" | "id" }) {
  const t = UI_TEXT[lang];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg border border-[#cc0000]/50 bg-[#0a0a0a] shadow-[0_0_60px_rgba(204,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#cc0000] rounded-full" />
            <span className="text-[10px] font-mono text-[#cc0000] tracking-widest">{t.evidenceFile} — {clue.category[lang]}</span>
          </div>
          <button onClick={onClose} className="text-[#444] hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[#cc0000]">{clue.icon}</div>
            <div>
              <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{clue.title[lang]}</p>
              <StatusLabel status={clue.status} lang={lang} />
            </div>
          </div>
          <div className="bg-[#050505] border border-[rgba(255,255,255,0.05)] p-4">
            <p className="text-[#888] text-xs leading-relaxed">{clue.fullContent[lang]}</p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[8px] font-mono text-[#333]">{t.logged}: {clue.timestamp}</span>
            <span className="text-[8px] font-mono text-[#333]">{t.clickToClose}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reset Modal ──────────────────────────────────────────────────────────────

function ResetModal({ onConfirm, onCancel, lang }: { onConfirm: () => void; onCancel: () => void; lang: "en" | "id" }) {
  const t = UI_TEXT[lang];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-sm border border-[#cc0000]/30 bg-[#0a0a0a] shadow-[0_0_50px_rgba(204,0,0,0.2)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0f0000]">
          <AlertTriangle size={14} className="text-[#cc0000]" />
          <span className="text-[10px] font-mono text-[#cc0000] tracking-[0.2em] font-bold">{t.resetTitle}</span>
        </div>
        
        <div className="p-6">
          <p className="text-xs text-[#888] leading-relaxed mb-8 text-center font-medium">
            {t.resetMsg}
          </p>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              className="w-full py-2.5 bg-[#cc0000] text-white text-[10px] font-bold tracking-[0.2em] hover:bg-[#ff0000] transition-all shadow-[0_0_15px_rgba(204,0,0,0.3)] uppercase"
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            >
              {t.confirmBtn}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 bg-transparent text-[#444] text-[10px] font-bold tracking-[0.2em] hover:text-[#888] transition-all uppercase"
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            >
              {t.cancelBtn}
            </button>
          </div>
        </div>
        
        <div className="h-1 w-full bg-[#111]">
          <div className="h-full bg-[#cc0000] animate-pulse w-full opacity-30" />
        </div>
      </div>
    </div>
  );
}

// ─── Education Report ─────────────────────────────────────────────────────────

function EducationReport({ report, onNext, lang }: { report: CaseData["educationReport"]; onNext: () => void; lang: "en" | "id" }) {
  const t = UI_TEXT[lang];
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={12} className="text-[#4ade80]" />
          <span className="text-[9px] font-mono text-[#4ade80] tracking-widest">{t.caseClosed}</span>
        </div>
        <p className="text-xs text-[#555] mt-0.5">{t.debrief}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: "none" }}>
        <div className="bg-[#4ade80]/5 border border-[#4ade80]/20 p-3 text-center">
          <p className="text-[#4ade80] text-xs font-mono font-bold tracking-wider">✓ {t.submitted}</p>
        </div>

        <div>
          <p className="text-[9px] font-mono text-[#cc0000] uppercase tracking-widest mb-2 border-b border-[rgba(255,255,255,0.05)] pb-1">{t.scamMethod}</p>
          <p className="text-[#777] text-xs leading-relaxed">{report.scamMethod[lang]}</p>
        </div>

        <div>
          <p className="text-[9px] font-mono text-[#ff9f43] uppercase tracking-widest mb-2 border-b border-[rgba(255,255,255,0.05)] pb-1">{t.redFlags}</p>
          <ul className="space-y-2">
            {report.redFlags.map((f, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="text-[#ff9f43] flex-shrink-0 font-mono text-[10px] mt-0.5">▸</span>
                <span className="text-[#666] text-xs leading-relaxed">{f[lang]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[9px] font-mono text-[#4ade80] uppercase tracking-widest mb-2 border-b border-[rgba(255,255,255,0.05)] pb-1">{t.prevention}</p>
          <ul className="space-y-2">
            {report.preventionTips.map((tip, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="text-[#4ade80] flex-shrink-0 font-mono text-[10px] mt-0.5">✓</span>
                <span className="text-[#666] text-[11px] font-mono leading-relaxed">{tip[lang]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
        <button
          onClick={onNext}
          className="w-full py-2.5 bg-[#cc0000] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#ff0000] transition-colors shadow-[0_0_16px_rgba(204,0,0,0.35)]"
          style={{ fontFamily: "'Space Grotesk',sans-serif" }}
        >
          {t.next} <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Oracle Panel ─────────────────────────────────────────────────────────────

function OraclePanel({
  messages, onHint, hintTier,
  isCorrect, report, onNext, lang,
}: {
  messages: OracleMsg[]; onHint: () => void; hintTier: HintTier;
  isCorrect: boolean | null;
  report: CaseData["educationReport"] | null; onNext: () => void;
  lang: "en" | "id";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = UI_TEXT[lang];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, lang]);

  if (isCorrect && report) return <EducationReport report={report} onNext={onNext} lang={lang} />;

  const hintsLeft = hintTier <= 3;
  const hintsUsed = hintTier - 1;

  const msgColors: Record<OracleMsg["type"], string> = {
    intel: "text-[#ccc]",
    hint: "text-[#ff9f43]",
    warn: "text-[#ff4040]",
    success: "text-[#4ade80]",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#cc0000] rounded-full animate-pulse" />
          <span className="text-[9px] font-mono text-[#cc0000] tracking-[0.2em]">{t.oracle}</span>
        </div>
        <p className="text-[8px] font-mono text-[#333] mt-0.5">{t.oracleLive}</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: "none" }}>
        {messages.map((m, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <div className="w-6 h-6 bg-[#cc0000] flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
              <Shield size={10} className="text-white" />
            </div>
            <div className="flex-1 bg-[#0d0d0d] border border-[rgba(255,255,255,0.05)] p-2.5">
              <p className={`text-xs leading-relaxed ${msgColors[m.type]}`}>
                {typeof m.text === "string" ? m.text : m.text[lang]}
              </p>
              <p className="text-[8px] font-mono text-[#333] mt-1.5">{m.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2.5 border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
        <button
          onClick={onHint}
          disabled={!hintsLeft}
          className={`w-full py-2.5 font-semibold text-sm transition-all duration-200 ${
            hintsLeft
              ? "bg-[#cc0000] text-white hover:bg-[#ff0000] shadow-[0_0_16px_rgba(204,0,0,0.35)]"
              : "bg-[#111] text-[#333] cursor-not-allowed border border-[rgba(255,255,255,0.06)]"
          }`}
          style={{ fontFamily: "'Space Grotesk',sans-serif" }}
        >
          {hintsLeft ? t.requestIntel : t.exhausted}
        </button>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`text-[8px] font-mono ${i < hintsUsed ? "text-[#333]" : "text-[#cc0000]"}`}>
              {i < hintsUsed ? "○" : "●"}
            </span>
          ))}
          <span className="text-[8px] font-mono text-[#444] ml-1">{3 - hintsUsed}/3 {t.remaining}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard({ caseData, onBack, lang, setLang }: { 
  caseData: CaseData; 
  onBack: () => void; 
  lang: "en" | "id";
  setLang: (l: "en" | "id") => void;
}) {
  const [clues, setClues] = useState<Clue[]>(() => {
    const saved = localStorage.getItem(`veil_clues_${caseData.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-map icons from the original caseData
      return parsed.map((c: any) => {
        const original = caseData.clues.find(oc => oc.id === c.id);
        return { ...c, icon: original ? original.icon : <FileText size={14} /> };
      });
    }
    return caseData.clues.filter(c => c.isInitial);
  });
  const [nodes, setNodes] = useState<GraphNode[]>(() => {
    const saved = localStorage.getItem(`veil_nodes_${caseData.id}`);
    return saved ? JSON.parse(saved) : caseData.nodes;
  });
  const [edges, setEdges] = useState<GraphEdge[]>(() => {
    const saved = localStorage.getItem(`veil_edges_${caseData.id}`);
    return saved ? JSON.parse(saved) : caseData.edges;
  });
  const [log, setLog] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem(`veil_log_${caseData.id}`);
    return saved ? JSON.parse(saved) : [
      { time: now(), text: { en: "Investigation session initialized.", id: "Sesi investigasi diinisialisasi." }, type: "intel" },
      { time: now(), text: { en: "Intelligence feed active.", id: "Umpan intelijen aktif." }, type: "intel" },
    ];
  });
  const [messages, setMessages] = useState<OracleMsg[]>(() => {
    const saved = localStorage.getItem(`veil_msgs_${caseData.id}`);
    return saved ? JSON.parse(saved) : [
      { text: { 
          en: "Investigation initiated. Use the Analyze Connection tool to map evidence and uncover the scam pattern. When you are confident, submit your final conclusion below. The graph is your assistant, not the final answer.",
          id: "Investigasi dimulai. Gunakan alat Analisis Hubungan untuk memetakan bukti dan mengungkap pola penipuan. Saat Anda yakin, kirim kesimpulan akhir di bawah. Grafik adalah asisten Anda, bukan jawaban akhir."
        }, 
        time: now(), 
        type: "intel" 
      },
    ];
  });
  const [isLogMinimized, setIsLogMinimized] = useState(false);
  const [hintTier, setHintTier] = useState<HintTier>(() => {
    const saved = localStorage.getItem(`veil_hint_${caseData.id}`);
    return saved ? parseInt(saved) as HintTier : 1;
  });
  const [scamType, setScamType] = useState(SCAM_TYPES[0].en);
  const [threatLevel, setThreatLevel] = useState(THREAT_LEVELS[0].en);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(() => {
    const saved = localStorage.getItem(`veil_correct_${caseData.id}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [inspecting, setInspecting] = useState<Clue | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(() => {
    const saved = localStorage.getItem(`veil_wrong_${caseData.id}`);
    return saved ? parseInt(saved) : 0;
  });
  const [wrongAdded, setWrongAdded] = useState(() => {
    const saved = localStorage.getItem(`veil_wadded_${caseData.id}`);
    return saved ? JSON.parse(saved) : false;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "fail">("idle");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const selectedCount = clues.filter((c) => c.selected).length;
  const analyzedCount = clues.filter((c) => c.status === "analyzed" || c.status === "intel-added").length;

  const pushLog = useCallback((textEn: string, textId: string, type: LogEntry["type"]) => {
    setLog((p) => [...p, { time: now(), text: { en: textEn, id: textId }, type }]);
  }, []);

  const pushMsg = useCallback((textEn: string, textId: string, type: OracleMsg["type"] = "intel") => {
    setMessages((p) => [...p, { text: { en: textEn, id: textId }, time: now(), type }]);
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    // Remove icons (React components) before saving
    const cluesToSave = clues.map(({ icon, ...rest }) => rest);
    localStorage.setItem(`veil_clues_${caseData.id}`, JSON.stringify(cluesToSave));
    localStorage.setItem(`veil_nodes_${caseData.id}`, JSON.stringify(nodes));
    localStorage.setItem(`veil_edges_${caseData.id}`, JSON.stringify(edges));
    localStorage.setItem(`veil_log_${caseData.id}`, JSON.stringify(log));
    localStorage.setItem(`veil_msgs_${caseData.id}`, JSON.stringify(messages));
    localStorage.setItem(`veil_hint_${caseData.id}`, hintTier.toString());
    localStorage.setItem(`veil_wrong_${caseData.id}`, wrongAttempts.toString());
    localStorage.setItem(`veil_wadded_${caseData.id}`, JSON.stringify(wrongAdded));
    localStorage.setItem(`veil_correct_${caseData.id}`, JSON.stringify(isCorrect));
  }, [clues, nodes, edges, log, messages, hintTier, wrongAttempts, wrongAdded, isCorrect, caseData.id]);

  const handleInspect = (id: string) => {
    const clue = clues.find((c) => c.id === id)!;
    setInspecting(clue);
    setClues((p) => p.map((c) => c.id === id ? { ...c, status: c.status === "unread" ? "read" : c.status, isNew: false } : c));
    pushLog(`Evidence file accessed: ${clue.title.en}`, `Berkas bukti diakses: ${clue.title.id}`, "intel");

    // Red Herring Auto-Resolution
    if (!clue.nodeId) {
      setTimeout(() => {
        pushMsg(
          "Analysis indicates this file might be irrelevant noise. Focus on financial and communication patterns.",
          "Analisis mendeteksi berkas ini mungkin hanya pengecoh (noise). Fokus pada pola finansial dan komunikasi.",
          "intel"
        );
      }, 1000);
    }
  };

  const handleToggle = (id: string) => {
    setClues((p) => p.map((c) => c.id === id ? { ...c, selected: !c.selected, isNew: false } : c));
  };

  const handleAnalyze = () => {
    const selectedClues = clues.filter((c) => c.selected);
    if (selectedClues.length !== 2) {
      pushMsg("Please select exactly two clues to analyze connection.", "Silakan pilih tepat dua bukti untuk menganalisis hubungan.", "warn");
      return;
    }

    const [clueA, clueB] = selectedClues;
    const pair1: [string, string] = [clueA.id, clueB.id];
    const pair2: [string, string] = [clueB.id, clueA.id];

    const isValid = caseData.validEdges.some(
      ([id1, id2]) => (id1 === pair1[0] && id2 === pair1[1]) || (id1 === pair2[0] && id2 === pair2[1])
    );

    if (!isValid) {
      pushMsg(`Invalid connection: "${clueA.title.en}" and "${clueB.title.en}" are not directly linked in this case.`, `Hubungan tidak valid: "${clueA.title.id}" dan "${clueB.title.id}" tidak terhubung langsung dalam kasus ini.`, "warn");
      pushLog(`Invalid analysis attempt: ${clueA.title.en} ↔ ${clueB.title.en}`, `Upaya analisis tidak valid: ${clueA.title.id} ↔ ${clueB.title.id}`, "warning");
      return;
    }

    // Fix: Connect specific nodes related to the clues
    const nodeAId = clueA.nodeId;
    const nodeBId = clueB.nodeId;

    if (nodeAId && nodeBId) {
      // Check if connection already exists
      const edgeExists = edges.some(e => 
        (e.from === nodeAId && e.to === nodeBId) || 
        (e.from === nodeBId && e.to === nodeAId)
      );

      if (edgeExists) {
        pushMsg(UI_TEXT.en.alreadyEstablished, UI_TEXT.id.alreadyEstablished, "warn");
        setClues(prev => prev.map(c => ({ ...c, selected: false })));
        return;
      }

      const newEdge: GraphEdge = {
        from: nodeAId,
        to: nodeBId,
        type: "user",
        label: { en: "linked", id: "terhubung" },
      };
      
      setEdges(prev => {
        const exists = prev.some(e => 
          (e.from === nodeAId && e.to === nodeBId) || 
          (e.from === nodeBId && e.to === nodeAId)
        );
        return exists ? prev : [...prev, newEdge];
      });

      setNodes(prev =>
        prev.map(n =>
          n.id === nodeAId || n.id === nodeBId ? { ...n, isActive: true } : n
        )
      );
      pushLog(`Valid connection mapped: ${clueA.title.en} ↔ ${clueB.title.en}`, `Hubungan valid dipetakan: ${clueA.title.id} ↔ ${clueB.title.id}`, "discovery");
      pushMsg(`Analysis successful. ${clueA.title.en} and ${clueB.title.en} are connected.`, `Analisis berhasil. ${clueA.title.id} dan ${clueB.title.id} terhubung.`, "intel");

      // UNLOCK MECHANIC: Unlock all remaining valid clues after any successful connection
      setClues(prev => {
        const currentIds = prev.map(c => c.id);
        const newClues = caseData.clues.filter(c => !currentIds.includes(c.id) && !c.id.startsWith("fail-") && c.nodeId);
        if (newClues.length > 0) {
          pushLog(`${newClues.length} new evidence file(s) decrypted.`, `${newClues.length} berkas bukti baru didekripsi.`, "discovery");
          pushMsg("New intelligence has been unlocked. Check your evidence files.", "Intelijen baru telah terbuka. Periksa berkas bukti Anda.", "success");
          return [...prev, ...newClues.map(c => ({ ...c, isNew: true }))];
        }
        return prev;
      });
    } else {
      pushMsg(
        "Connection cannot be mapped visually. This evidence may be irrelevant noise.",
        "Koneksi tidak dapat dipetakan secara visual. Bukti ini mungkin hanya pengecoh.",
        "warn"
      );
      pushLog(`Irrelevant connection attempt: ${clueA.title.en} ↔ ${clueB.title.en}`, `Upaya analisis tidak relevan: ${clueA.title.id} ↔ ${clueB.title.id}`, "warning");
    }

    setClues(prev =>
      prev.map(c =>
        c.id === clueA.id || c.id === clueB.id
          ? { ...c, status: "analyzed", selected: false }
          : c
      )
    );
  };

  const handleHint = () => {
    if (hintTier > 3) return;
    const hint = caseData.oracleHints[hintTier as 1 | 2 | 3];
    pushMsg(`[TIER ${hintTier} INTEL] ${hint.en}`, `[INTEL TINGKAT ${hintTier}] ${hint.id}`, "hint");
    pushLog(`Tier ${hintTier} intel requested.`, `Intel tingkat ${hintTier} diminta.`, "hint");
    setHintTier((p) => (p + 1) as HintTier);
  };

  const handleSubmit = () => {
    setSubmitState("loading");
    setSubmitting(true);
    setTimeout(() => {
      const ok = scamType === caseData.correctScamType && threatLevel === caseData.correctThreatLevel;
      if (ok) {
        setIsCorrect(true);
        setSubmitState("success");
        pushLog("Correct conclusion submitted — case closed.", "Kesimpulan benar dikirim — kasus ditutup.", "discovery");
      } else {
        const attempt = wrongAttempts + 1;
        setWrongAttempts(attempt);
        setSubmitState("fail");

        // PROGRESSIVE FAILURE CLUES (Up to 3 levels)
        if (attempt <= 3) {
          const failureIntel = caseData.failureClues[attempt - 1];
          if (failureIntel) {
            const newClueId = `fail-${attempt}`;
            const targetNodeId = failureIntel.targetNodeId;
            const sourceClue = caseData.clues.find(c => c.id === failureIntel.relatedClueId);
            const sourceNodeId = sourceClue?.nodeId;

            const failureClue: Clue = {
              id: newClueId,
              icon: getIcon("Activity"),
              title: {
                en: `Forensic Intel Level ${attempt}`,
                id: `Intel Forensik Tingkat ${attempt}`
              },
              preview: { 
                en: "Additional analysis requested due to incorrect conclusion.", 
                id: "Analisis tambahan diminta karena kesimpulan yang salah." 
              },
              fullContent: failureIntel.text,
              status: "unread",
              selected: false,
              category: { en: "FORENSICS", id: "FORENSIK" },
              timestamp: now(),
              nodeId: targetNodeId,
            };

            setClues((p) => {
              if (p.some(c => c.id === newClueId)) return p;
              return [...p, failureClue];
            });

            // Activate target node
            setNodes((p) => p.map(n => n.id === targetNodeId ? { ...n, isActive: true } : n));

            // Create edge from source node to target node if not exists
            if (sourceNodeId && targetNodeId) {
              setEdges((prev) => {
                const exists = prev.some(e => (e.from === sourceNodeId && e.to === targetNodeId) || (e.from === targetNodeId && e.to === sourceNodeId));
                if (exists) return prev;
                return [...prev, { 
                  from: sourceNodeId, 
                  to: targetNodeId, 
                  type: "oracle", 
                  label: { en: "forensic link", id: "koneksi forensik" } 
                }];
              });
            }
            
            pushLog(`Additional forensic intel level ${attempt} unlocked.`, `Intel forensik tambahan tingkat ${attempt} terbuka.`, "warning");
            pushMsg(
              `Conclusion rejected. New forensic intelligence level ${attempt} has been added to help your analysis.`,
              `Kesimpulan ditolak. Intelijen forensik baru tingkat ${attempt} telah ditambahkan untuk membantu analisis Anda.`,
              "warn"
            );
          }
          setTimeout(() => setSubmitState("idle"), 1500);
        } else {
          // FORCE CORRECT: After 4 failures, reveal answer
          pushMsg(
            "Maximum attempts reached. Forensic integrity compromised. Revealing correct conclusion for training purposes.",
            "Batas maksimal percobaan tercapai. Integritas forensik terganggu. Mengungkapkan kesimpulan yang benar untuk tujuan pelatihan.",
            "warn"
          );
          pushLog("Case auto-resolved by Oracle due to maximum failure threshold.", "Kasus diselesaikan otomatis oleh Oracle karena batas kegagalan maksimal.", "warning");
          
          setTimeout(() => {
            setIsCorrect(true);
            setSubmitState("success");
          }, 1000);
        }
      }
      setSubmitting(false);
    }, 800);
  };

  const logColors: Record<LogEntry["type"], string> = {
    discovery: "text-[#4ade80]",
    intel: "text-[#666]",
    hint: "text-[#ff9f43]",
    warning: "text-[#ff4040]",
  };

  const handleClearSelection = () => {
    setClues(prev => prev.map(c => ({ ...c, selected: false })));
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const performReset = () => {
    const keys = [
      `veil_clues_${caseData.id}`,
      `veil_nodes_${caseData.id}`,
      `veil_edges_${caseData.id}`,
      `veil_log_${caseData.id}`,
      `veil_msgs_${caseData.id}`,
      `veil_hint_${caseData.id}`,
      `veil_wrong_${caseData.id}`,
      `veil_wadded_${caseData.id}`,
      `veil_correct_${caseData.id}`
    ];
    keys.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  const submitBtnStyle = {
    idle: "bg-[#cc0000] text-white hover:bg-[#ff0000] shadow-[0_0_16px_rgba(204,0,0,0.35)]",
    loading: "bg-[#551100] text-[#cc0000] cursor-wait",
    success: "bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40",
    fail: "bg-[#ff4040]/10 text-[#ff4040] border border-[#ff4040]/30",
  };

  const submitBtnLabel = {
    idle: UI_TEXT[lang].submit,
    loading: UI_TEXT[lang].submitting,
    success: UI_TEXT[lang].submitted,
    fail: UI_TEXT[lang].retry,
  };

  return (
    <div className="h-screen bg-[#080808] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>
      <header className="flex items-center justify-between px-4 py-0 h-9 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0 bg-[#080808]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[#444] hover:text-[#cc0000] text-[9px] font-mono tracking-wider transition-colors">
            {UI_TEXT[lang].files}
          </button>
          <span className="text-[rgba(255,255,255,0.1)]">|</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#cc0000] rounded-full" />
            <span className="text-[9px] font-mono text-[#cc0000] tracking-[0.2em]">VEIL</span>
          </div>
          <span className="text-[rgba(255,255,255,0.1)]">|</span>
          <span className="text-[9px] font-mono text-[#555] tracking-wider">{UI_TEXT[lang].caseLabel} {caseData.caseNum}: {caseData.title[lang]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-[#333]">{analyzedCount}/{clues.length} {UI_TEXT[lang].analyzed}</span>
          <span className="text-[rgba(255,255,255,0.1)]">|</span>
          <button 
            onClick={handleReset}
            className="px-1.5 py-0.5 border border-[rgba(255,255,255,0.1)] hover:border-[#cc0000] text-[8px] font-mono text-[#555] hover:text-white transition-colors"
          > {UI_TEXT[lang].reset}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Case Evidence */}
        <div className="w-52 flex-shrink-0 border-r border-[rgba(255,255,255,0.06)] flex flex-col bg-[#080808]">
          <div className="px-3 py-2.5 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
            <p className="text-[9px] font-mono text-[#888] tracking-[0.25em]">{UI_TEXT[lang].evidence}</p>
            <p className="text-[8px] font-mono text-[#333] mt-0.5">{clues.length} {UI_TEXT[lang].filesLabel} · {selectedCount} {UI_TEXT[lang].selectedLabel}</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]" style={{ scrollbarWidth: "none" }}>
            {clues.map((clue) => (
              <EvidenceCard
                key={clue.id}
                clue={clue}
                onInspect={() => handleInspect(clue.id)}
                onToggle={() => handleToggle(clue.id)}
                lang={lang}
              />
            ))}
          </div>

          <div className="p-2.5 border-t border-[rgba(255,255,255,0.06)] flex-shrink-0 flex flex-col gap-2">
            {selectedCount > 0 && (
              <button
                onClick={handleClearSelection}
                className="w-full py-1.5 text-[10px] font-mono text-[#555] hover:text-[#ccc] border border-[rgba(255,255,255,0.05)] transition-colors"
              >
                {UI_TEXT[lang].clear} ({selectedCount})
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={selectedCount < 2}
              className={`w-full py-2.5 font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-250 ${
                selectedCount >= 2
                  ? "bg-[#cc0000] text-white hover:bg-[#ff0000] shadow-[0_0_20px_rgba(204,0,0,0.35)]"
                  : "border border-[rgba(255,255,255,0.08)] text-[#333] cursor-not-allowed"
              }`}
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            >
              <Link2 size={11} />
              {UI_TEXT[lang].analyze}
              {selectedCount >= 2 && <span className="bg-white/20 rounded-sm px-1 text-[8px]">{selectedCount}</span>}
            </button>
          </div>
        </div>

        {/* CENTER — Investigation workspace */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#cc0000] text-base font-bold tracking-wider" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                  {UI_TEXT[lang].caseLabel} {caseData.caseNum}: {caseData.title[lang]}
                </p>
                <p className="text-[#555] text-xs mt-1 leading-relaxed max-w-2xl">{caseData.description[lang]}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#161616] relative">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#cc0000] transition-all duration-500"
                  style={{ width: `${(analyzedCount / Math.max(clues.length, 1)) * 100}%` }}
                />
              </div>
              <span className="text-[8px] font-mono text-[#333]">{Math.round((analyzedCount / Math.max(clues.length, 1)) * 100)}% {UI_TEXT[lang].pctAnalyzed}</span>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <InvestigationGraph nodes={nodes} edges={edges} lang={lang} />
            <div className={`absolute bottom-4 right-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(8,8,8,0.92)] backdrop-blur-sm transition-all duration-300 ${isLogMinimized ? 'w-40 h-8' : 'w-60 h-40'}`}>
              <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between cursor-pointer" onClick={() => setIsLogMinimized(!isLogMinimized)}>
                <p className="text-[8px] font-mono text-[#888] tracking-[0.2em]">{UI_TEXT[lang].log}</p>
                <button className="text-[#444] hover:text-[#ccc]">
                  {isLogMinimized ? <ChevronRight size={10} className="-rotate-90" /> : <ChevronRight size={10} className="rotate-90" />}
                </button>
              </div>
              {!isLogMinimized && (
                <div className="p-2.5 space-y-1.5 overflow-y-auto h-[calc(100%-32px)]" style={{ scrollbarWidth: "none" }}>
                  {log.slice(-15).map((e, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[7px] font-mono text-[#333] flex-shrink-0 mt-0.5">{e.time}</span>
                      <span className={`text-[9px] font-mono leading-snug ${logColors[e.type]}`}>
                        {typeof e.text === "string" ? e.text : e.text[lang]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Oracle */}
        <div className="w-64 flex-shrink-0 border-l border-[rgba(255,255,255,0.06)] flex flex-col bg-[#080808]">
          <OraclePanel
            messages={messages} onHint={handleHint} hintTier={hintTier}
            isCorrect={isCorrect} report={isCorrect ? caseData.educationReport : null} onNext={onBack}
            lang={lang}
          />
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="flex-shrink-0 border-t border-[rgba(255,255,255,0.06)] bg-[#080808]">
        <div className="flex items-stretch gap-0 h-14">
          <div className="flex-[2] border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-center px-4 hover:bg-white/[0.02] transition-colors">
            <label className="text-[8px] font-mono text-[#444] tracking-widest mb-1">{UI_TEXT[lang].scamType}</label>
            <div className="relative">
              <select
                value={scamType}
                onChange={(e) => setScamType(e.target.value)}
                className="bg-transparent text-xs text-[#ccc] focus:outline-none appearance-none cursor-pointer w-full font-medium"
              >
                {SCAM_TYPES.map((s, i) => (
                  <option key={i} value={s.en} style={{ background: "#111" }}>
                    {s[lang]}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#333]">
                <ChevronRight size={10} className="rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex-1 border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-center px-4 hover:bg-white/[0.02] transition-colors min-w-[160px]">
            <label className="text-[8px] font-mono text-[#444] tracking-widest mb-1">{UI_TEXT[lang].threat}</label>
            <div className="relative">
              <select
                value={threatLevel}
                onChange={(e) => setThreatLevel(e.target.value)}
                className="bg-transparent text-xs text-[#ccc] focus:outline-none appearance-none cursor-pointer w-full font-medium"
              >
                {THREAT_LEVELS.map((t, i) => (
                  <option key={i} value={t.en} style={{ background: "#111" }}>
                    {t[lang]}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#333]">
                <ChevronRight size={10} className="rotate-90" />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={scamType === SCAM_TYPES[0].en || threatLevel === THREAT_LEVELS[0].en || submitting}
            style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            className={`flex-[1.5] flex-shrink-0 font-bold text-xs tracking-[0.1em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              scamType !== SCAM_TYPES[0].en && threatLevel !== THREAT_LEVELS[0].en
                ? submitBtnStyle[submitState]
                : "bg-[#0d0d0d] text-[#222] cursor-not-allowed border-l border-[rgba(255,255,255,0.06)]"
            }`}
          >
            {submitBtnLabel[submitState]}
          </button>
        </div>
      </div>

      {inspecting && <ClueModal clue={inspecting} onClose={() => setInspecting(null)} lang={lang} />}
      {showResetConfirm && <ResetModal onConfirm={performReset} onCancel={() => setShowResetConfirm(false)} lang={lang} />}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("init");
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "id">("en");
  const [cases, setCases] = useState<CaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch('/data/case_1.json'),
          fetch('/data/case_2.json')
        ]);
        const case1Raw: CaseDataFromJSON = await res1.json();
        const case2Raw: CaseDataFromJSON = await res2.json();
        
        const transformCaseData = (caseData: CaseDataFromJSON): CaseData => ({
          ...caseData,
          clues: caseData.clues.map(c => ({...c, icon: getIcon(c.icon), iconString: c.icon})),
          wrongAnswerClue: {...caseData.wrongAnswerClue, icon: getIcon(caseData.wrongAnswerClue.icon), iconString: caseData.wrongAnswerClue.icon}
        });

        setCases([transformCaseData(case1Raw), transformCaseData(case2Raw)]);
      } catch (error) {
        console.error("Gagal memuat data kasus:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseData();
  }, []);

  const activeCase = cases.find((c) => c.id === activeCaseId);

  const handleInit = (selectedLang: "en" | "id") => {
    setLang(selectedLang);
    setScreen("case-select");
  };

  if (isLoading) {
    return (
      <div className="dark" style={{ fontFamily: "'Inter',sans-serif" }}>
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#cc0000] flex items-center justify-center" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                <Shield size={14} className="text-white" />
              </div>
              <span className="text-4xl font-bold tracking-[0.5em] text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                VEIL
              </span>
            </div>
            <p className="text-[#555] text-xs font-mono tracking-[0.2em] uppercase mt-4 animate-pulse">
              LOADING INVESTIGATION FILES...
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Mobile Blocker */}
      <div className="lg:hidden fixed inset-0 z-[999] bg-[#080808] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 bg-[#cc0000] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(204,0,0,0.4)]" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
          <Shield size={20} className="text-white" />
        </div>
        <p className="text-[#cc0000] font-mono text-[10px] tracking-[0.3em] mb-4 uppercase">System Error // Access Denied</p>
        <p className="text-[#888] text-xs leading-relaxed max-w-sm font-mono">
          VEIL Intelligence Terminal requires a high-resolution desktop interface for secure evidence mapping. 
          <br /><br />
          <span className="text-[#ff4040]">Mobile connections are automatically rejected.</span>
        </p>
        <div className="mt-8 flex gap-2">
          <span className="w-1 h-1 bg-[#cc0000] animate-pulse"></span>
          <span className="w-1 h-1 bg-[#cc0000] animate-pulse" style={{ animationDelay: "200ms" }}></span>
          <span className="w-1 h-1 bg-[#cc0000] animate-pulse" style={{ animationDelay: "400ms" }}></span>
        </div>
      </div>

      {/* Main Desktop Interface */}
      <div className="hidden lg:block min-h-screen">
        {screen === "init" && (
          <InitializationScreen onSelect={handleInit} />
        )}
        {screen === "case-select" && (
          <CaseSelectScreen cases={cases} onSelect={(id) => { setActiveCaseId(id); setScreen("investigation"); }} lang={lang} setLang={setLang} />
        )}
        {screen === "investigation" && activeCase && (
          <Dashboard 
            key={activeCase.id}
            caseData={activeCase} 
            onBack={() => setScreen("case-select")} 
            lang={lang} 
            setLang={setLang} 
          />
        )}
      </div>
    </div>
  );
}