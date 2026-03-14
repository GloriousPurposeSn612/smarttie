import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard } from "@/components/DataCard";
import { ScanningLoader } from "@/components/ScanningLoader";
import { findTreatment, type Treatment } from "@/lib/mockData";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from "recharts";

function ConfidenceGauge({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (value * circumference);

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="70" fill="none" stroke="hsl(220 15% 16%)" strokeWidth="8" />
        <motion.circle
          cx="90" cy="90" r="70" fill="none"
          stroke="hsl(222 80% 60%)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          transform="rotate(-90 90 90)"
        />
        <text x="90" y="85" textAnchor="middle" fill="hsl(222 80% 60%)" fontSize="36" fontFamily="Geist Mono, monospace" fontWeight="bold">
          {percent}%
        </text>
        <text x="90" y="108" textAnchor="middle" fill="hsl(215 15% 50%)" fontSize="10" fontFamily="Geist Mono, monospace" letterSpacing="2" style={{ textTransform: "uppercase" }}>
          CONFIDENCE
        </text>
      </svg>
    </div>
  );
}

export default function TrajectoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setTreatment(findTreatment(id || ""));
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="pb-16">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <ScanningLoader text="Building trajectory model..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!treatment) {
    return (
      <DashboardLayout>
        <div className="pb-16 text-center py-20">
          <p className="text-muted-foreground">Treatment data not found.</p>
          <button onClick={() => navigate("/dashboard")} className="mt-4 text-primary font-mono text-sm hover:underline">Return to Dashboard</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="pb-16">
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Analysis
          </button>
          <h1 className="text-3xl font-bold tracking-tight">{treatment.name} — Trajectory</h1>
          <p className="text-muted-foreground mt-1">Full treatment journey visualization from {treatment.trajectory.length * 100}+ patient reports.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main trajectory chart */}
          <DataCard title="Treatment Trajectory Curve" subtitle="Day 1 → Month 3" delay={0.1} className="lg:col-span-2">
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={treatment.trajectory}>
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(174 60% 56%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(174 60% 56%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 62% 50%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(0 62% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#444" fontSize={10} tickFormatter={(v) => `Day ${v}`} />
                  <YAxis stroke="#444" fontSize={10} domain={[-1, 1]} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0A0C10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                    labelFormatter={(v) => `Day ${v}`}
                    formatter={(v: number, name: string) => [v.toFixed(2), name === "sentiment" ? "Sentiment" : "Side Effects"]}
                  />
                  <Area type="monotone" dataKey="sentiment" stroke="hsl(174 60% 56%)" fill="url(#tealGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sideEffects" stroke="hsl(0 62% 50%)" fill="url(#redGrad)" strokeWidth={2} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-6 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-primary rounded" /> Sentiment</span>
              <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-destructive rounded border-dashed" /> Side Effects</span>
            </div>
          </DataCard>

          {/* Confidence Gauge */}
          <DataCard title="Confidence Score" subtitle="Statistical confidence level" delay={0.2}>
            <div className="mt-4">
              <ConfidenceGauge value={treatment.confidence} />
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-secondary">
                  <span className="text-muted-foreground">DATA_POINTS</span>
                  <span className="text-primary font-tabular">{(Math.floor(2000 + Math.random() * 6000)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-secondary">
                  <span className="text-muted-foreground">SOURCES</span>
                  <span className="text-primary">3 PLATFORMS</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-secondary">
                  <span className="text-muted-foreground">TIME_RANGE</span>
                  <span className="text-primary">24 MONTHS</span>
                </div>
              </div>
            </div>
          </DataCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Sentiment Evolution */}
          <DataCard title="Sentiment Evolution" subtitle="Negative → Neutral → Positive" delay={0.3}>
            <div className="mt-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={treatment.trajectory}>
                  <XAxis dataKey="day" stroke="#444" fontSize={10} tickFormatter={(v) => `Day ${v}`} />
                  <YAxis stroke="#444" fontSize={10} domain={[-1, 1]} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" label={{ value: "Neutral", fill: "#555", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0A0C10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelFormatter={(v) => `Day ${v}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="hsl(174 60% 56%)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0A0C10", stroke: "hsl(174 60% 56%)", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "hsl(174 60% 56%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DataCard>

          {/* Side Effect Probability */}
          <DataCard title="Side Effect Probability Distribution" subtitle="Population-weighted occurrence rates" delay={0.4}>
            <div className="mt-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={treatment.sideEffects}>
                  <XAxis dataKey="name" stroke="#444" fontSize={9} angle={-20} textAnchor="end" height={60} tick={{ fill: "hsl(210 20% 85%)" }} />
                  <YAxis stroke="#444" fontSize={10} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip
                    formatter={(v: number) => `${Math.round(v * 100)}%`}
                    contentStyle={{ backgroundColor: "#0A0C10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                    {treatment.sideEffects.map((se, i) => (
                      <Cell
                        key={i}
                        fill={se.probability > 0.7 ? "hsl(0 62% 50%)" : se.probability > 0.4 ? "hsl(38 80% 55%)" : "hsl(174 60% 56%)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-destructive" /> High (&gt;70%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-warning" /> Medium</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" /> Low</span>
            </div>
          </DataCard>
        </div>

        {/* Patient Quotes by Timeline */}
        <DataCard title="Patient Signal Timeline" subtitle="Curated quotes mapped to treatment phase" delay={0.5} className="mt-6">
          <div className="mt-4 relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-6 pl-10">
              {treatment.patientQuotes.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="relative"
                >
                  <div className="absolute -left-[26px] top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  <div className="p-4 rounded-lg bg-secondary border border-border">
                    <span className="text-xs font-mono text-primary font-tabular">DAY {q.day}</span>
                    <p className="text-sm italic text-muted-foreground mt-2">"{q.text}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </DataCard>
      </div>
    </DashboardLayout>
  );
}
