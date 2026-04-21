import React, { useState, useEffect, useMemo } from 'react';
import { 
  Barber, 
  Unit, 
  Evaluation, 
  INITIAL_UNITS,
  BARBER_LIST
} from './types';
import { 
  Users, 
  ClipboardList, 
  ChevronRight, 
  MapPin, 
  Scissors, 
  Trash2, 
  Save,
  CheckCircle2,
  Flag,
  Zap,
  Timer,
  Calendar,
  Clock,
  ThumbsUp,
  ShoppingBag,
  AlertCircle,
  MessageSquare,
  LayoutGrid,
  TrendingUp,
  Award,
  Star,
  Trophy,
  Heart,
  Medal,
  ShieldAlert,
  Search,
  ChevronDown,
  TrendingDown,
  Skull
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LogoLocal from './assets/logo.png';

const STORAGE_KEYS = {
  BARBERS: 'own_barbers',
  UNITS: 'own_units',
  EVALUATIONS: 'own_evaluations'
};

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

type Tab = 'dashboard' | 'feedback' | 'metrics' | 'team';

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [units, setUnits] = useState<Unit[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  
  // -- Period State --
  const [viewMode, setViewMode] = useState<'mensal' | 'anual'>('mensal');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // -- Sessão do OWN Hub (injetada via relay token) --
  const hubSession = (window as any).__OWN_HUB_SESSION__;
  const hubRole = new URLSearchParams(window.location.search).get('hub_role') || 'operador';
  const isHubAdmin = hubRole === 'administrador';


  // -- Form States --
  const [newBarber, setNewBarber] = useState({ name: '', unitId: '' });
  
  const [newEval, setNewEval] = useState<Partial<Evaluation>>({ 
    clientName: '', unitId: '', barberId: '', 
    serviceDate: new Date().toISOString().split('T')[0], serviceTime: '',
    clientArrivalStatus: 'SIM', serviceStartStatus: 'SIM', problemDescription: '',
    complaintStatus: 'NÃO', leftFeedback: false, feedbackDescription: '',
    isSubscriber: false, offeredSubscription: false, subscriptionInterest: 'NENHUM',
    needsFollowUp: false, generalNotes: '', satisfactionLevel: 5
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // --- Initial Load ---
  useEffect(() => {
    const savedUnits = localStorage.getItem(STORAGE_KEYS.UNITS);
    const savedBarbers = localStorage.getItem(STORAGE_KEYS.BARBERS);
    const savedEvals = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    if (savedUnits) setUnits(JSON.parse(savedUnits)); else setUnits(INITIAL_UNITS);
    if (savedBarbers) setBarbers(JSON.parse(savedBarbers)); else {
      setBarbers(BARBER_LIST.map((b, idx) => ({ id: (idx + 1).toString(), name: b.name, unitId: b.unitId })));
    }
    if (savedEvals) setEvaluations(JSON.parse(savedEvals));
  }, []);

  // --- Persistence ---
  useEffect(() => { if (units.length > 0) localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units)); }, [units]);
  useEffect(() => { if (barbers.length > 0) localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers)); }, [barbers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations)); }, [evaluations]);

  // --- Computed Filters ---
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
        const evalDate = new Date(e.date);
        return evalDate.getFullYear() === selectedYear && (viewMode === 'mensal' ? evalDate.getMonth() === selectedMonth : true);
    });
  }, [evaluations, selectedYear, selectedMonth, viewMode]);

  // --- Gamification Engine ---
  const pilotCards = useMemo(() => {
    return barbers.map(barber => {
      const bEvals = filteredEvaluations.filter(e => e.barberId === barber.id);
      const total = bEvals.length;
      
      const satisfAvg = total > 0 ? bEvals.reduce((acc, curr) => acc + (curr.satisfactionLevel || 0), 0) / total : 0;
      const recRate = total > 0 ? (bEvals.filter(e => e.wouldRecommend).length / total) * 100 : 0;
      const offerRate = total > 0 ? (bEvals.filter(e => e.offeredSubscription).length / total) * 100 : 0;
      const punctRate = total > 0 ? (bEvals.filter(e => e.serviceStartStatus === 'SIM').length / total) * 100 : 0;
      const correctionCount = bEvals.filter(e => e.hadReturnRequest).length;

      // Medal Logic
      const medals = [];
      if (satisfAvg >= 4.8 && total >= 5) medals.push({ id: 'top', icon: Star, label: 'Líder de Satisfação', color: 'text-yellow-400' });
      if (punctRate === 100 && total >= 5) medals.push({ id: 'time', icon: Timer, label: 'Mestre da Pontualidade', color: 'text-blue-400' });
      if (offerRate >= 80 && total >= 5) medals.push({ id: 'sales', icon: Zap, label: 'Especialista de Vendas', color: 'text-brand' });
      if (recRate === 100 && total >= 5) medals.push({ id: 'fav', icon: Heart, label: 'Nota Máxima', color: 'text-pink-400' });

      const xp = Math.min(1000, Math.round(
        (satisfAvg * 100) + 
        (recRate * 2) + 
        (offerRate * 2) + 
        (punctRate) - 
        (correctionCount * 60)
      ));

      return { ...barber, total, satisfAvg, recRate, offerRate, punctRate, correctionCount, medals, xp };
    }).sort((a, b) => b.xp - a.xp);
  }, [barbers, filteredEvaluations]);

  const followUpList = useMemo(() => {
    return filteredEvaluations
      .filter(e => e.needsFollowUp)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredEvaluations]);

  const warningRanking = useMemo(() => {
    return [...pilotCards]
      .filter(p => p.correctionCount > 0)
      .sort((a, b) => b.correctionCount - a.correctionCount);
  }, [pilotCards]);

  // --- Handlers ---
  const handleAddBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarber.name || !newBarber.unitId) return;
    setBarbers([...barbers, { id: crypto.randomUUID(), name: newBarber.name.toUpperCase(), unitId: newBarber.unitId }]);
    setNewBarber({ name: '', unitId: '' });
  };

  const handleSubmitEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEval.barberId || !newEval.clientName) return;
    const evaluation: Evaluation = {
      ...(newEval as Evaluation), id: crypto.randomUUID(), rating: newEval.satisfactionLevel || 5,
      hadReturnRequest: newEval.needsFollowUp,
      date: new Date().toISOString(), season: `${new Date().getFullYear()}`
    };
    setEvaluations([evaluation, ...evaluations]);
    setNewEval({ 
        clientName: '', unitId: '', barberId: '', serviceDate: new Date().toISOString().split('T')[0], serviceTime: '',
        clientArrivalStatus: 'SIM', serviceStartStatus: 'SIM', problemDescription: '', complaintStatus: 'NÃO', 
        leftFeedback: false, feedbackDescription: '', isSubscriber: false, offeredSubscription: false, 
        subscriptionInterest: 'NENHUM', needsFollowUp: false, generalNotes: '', satisfactionLevel: 5
    });
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setActiveTab('dashboard'); }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black relative overflow-hidden text-zinc-100 font-sans antialiased bg-mesh">
      
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-zinc-950 border-r border-zinc-900 flex flex-col z-50 relative shrink-0">
        <div className="p-10 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-2xl p-4 mx-auto flex items-center justify-center border border-zinc-800 shadow-xl group hover:border-brand/40 transition-colors">
            <img src={LogoLocal} alt="Own Barber Club" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = "https://ownbarberclublp.vercel.app/assets/logo.png" }} />
          </div>
          <div className="mt-6">
            <div className="text-2xl font-black tracking-tighter uppercase">OWN <span className="text-brand">FEEDBACK</span></div>
            <div className="text-[10px] uppercase tracking-[0.4em] font-medium text-zinc-500 mt-2">Professional Control</div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          {[
            { id: 'dashboard', icon: LayoutGrid, label: 'Ranking' },
            { id: 'metrics', icon: TrendingUp, label: 'Performance' },
            { id: 'feedback', icon: ClipboardList, label: 'Avaliações' },
            { id: 'team', icon: Users, label: 'Unidades & Time' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`nav-item ${activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-brand' : ''} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]" />}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-zinc-900">
           <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800 text-center">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Status do Sistema</div>
              <div className="flex items-center justify-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-xs font-bold">OPERACIONAL</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 lg:p-14 overflow-y-auto relative no-scrollbar">
        
        {/* Header Seletor Estilo Moderno */}
        <div className="sticky top-0 z-40 mb-12 flex flex-wrap items-center justify-between gap-8 bg-black/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-zinc-900 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 shadow-inner">
              {['mensal', 'anual'].map(mode => (
                 <button key={mode} onClick={() => setViewMode(mode as any)} className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-tight transition-all ${viewMode === mode ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>{mode}</button>
              ))}
            </div>
            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
            <select className="bg-transparent text-white font-black uppercase text-xl outline-none cursor-pointer hover:text-brand transition-colors" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-zinc-950">{y}</option>)}
            </select>
          </div>
          {viewMode === 'mensal' && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
               {MONTHS.map((m, idx) => (
                 <button key={m} onClick={() => setSelectedMonth(idx)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-[10px] uppercase transition-all border ${selectedMonth === idx ? 'bg-brand border-brand text-white shadow-[0_4px_12px_rgba(220,38,38,0.4)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}>{m}</button>
               ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* DASHBOARD - LAYOUT LADO A LADO */}
          {activeTab === 'dashboard' && (
            <motion.div key="db" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-12">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-900 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-brand/10 text-brand font-bold px-3 py-1 rounded-md text-[10px] uppercase tracking-wider border border-brand/20">Performance</span>
                    <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em]">{viewMode === 'mensal' ? `${MONTHS[selectedMonth]} ${selectedYear}` : `ANUAL ${selectedYear}`}</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">THE <span className="text-brand">RANK.</span></h1>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* COLUNA ESQUERDA: RANKING PRINCIPAL (2/3) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center gap-3 text-zinc-500 mb-6">
                     <Trophy size={18} className="text-yellow-500" />
                     <span className="text-xs font-bold uppercase tracking-widest">Liderança da Temporada</span>
                  </div>
                  {pilotCards.map((pilot, index) => (
                    <motion.div key={pilot.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-6 p-6 card transition-all border-l-4 ${index < 3 ? 'border-brand' : 'border-zinc-800 hover:bg-zinc-900/50'}`}>
                      <div className="w-16 md:w-20 flex flex-col items-center justify-center shrink-0">
                        <span className={`text-4xl md:text-5xl font-black tracking-tighter leading-none ${index === 0 ? 'text-brand' : index < 3 ? 'text-white' : 'text-zinc-800'}`}>P{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
                        <div className="flex items-center gap-6 overflow-hidden">
                           <div className="relative shrink-0">
                              <div className={`w-20 h-20 bg-zinc-950 rounded-xl border flex items-center justify-center overflow-hidden relative z-10 ${index < 3 ? 'border-brand/40' : 'border-zinc-800'}`}>
                                 <img src={`https://ownbarberclublp.vercel.app/assets/equipe-${pilot.name.toLowerCase()}.JPG`} alt={pilot.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                 <span className="absolute inset-0 flex items-center justify-center text-zinc-900 font-black text-2xl">{pilot.name.substring(0,2)}</span>
                              </div>
                              {index === 0 && <div className="absolute -top-2 -right-2 bg-brand text-white rounded-full p-1.5 shadow-lg z-20 border-2 border-zinc-950 scale-75"><Award size={20} /></div>}
                           </div>
                          <div className="min-w-0">
                            <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-none mb-2 truncate">{pilot.name}</h3>
                            <div className="flex items-center gap-3">
                               <div className="flex items-center gap-1.5">
                                  <MapPin size={10} className="text-brand" />
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 truncate">{units.find(u => u.id === pilot.unitId)?.name}</span>
                               </div>
                               <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                               <div className="flex gap-1.5">
                                  {pilot.medals.slice(0, 3).map(m => (<m.icon key={m.id} size={12} className={m.color} />))}
                               </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-4xl font-black tracking-tighter leading-none text-glow">{pilot.satisfAvg.toFixed(2)}</div>
                          <div className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 mt-1">Média</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* COLUNA DIREITA: ALERTA DE AJUSTE (1/3) */}
                <div className="lg:col-span-4 space-y-6 lg:border-l lg:border-zinc-900 lg:pl-10">
                   <header className="flex items-center gap-4 text-brand mb-8 pt-2">
                      <TrendingDown size={24} />
                      <h2 className="text-2xl font-black tracking-tight uppercase leading-none"> ALERTA DE <span className="text-white">CONTROLE</span></h2>
                   </header>
                   
                   <div className="space-y-4">
                      {warningRanking.length > 0 ? warningRanking.map((pilot, idx) => (
                        <motion.div key={pilot.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 group hover:border-brand/30 transition-all relative overflow-hidden">
                           <div className="absolute right-0 bottom-0 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity"><Skull size={60} /></div>
                           <div className="flex items-center justify-between mb-4 relative z-10">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-black rounded-lg border border-brand/20 flex items-center justify-center text-brand font-black italic items-center">#{idx + 1}</div>
                                 <div className="text-lg font-black uppercase tracking-tight">{pilot.name}</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-2xl font-black text-brand leading-none">{pilot.correctionCount}</div>
                                 <div className="text-[8px] font-bold uppercase text-zinc-600 tracking-widest">RETORNOS</div>
                              </div>
                           </div>
                           <div className="bg-black/60 p-3 rounded-xl border border-zinc-800/50 relative z-10">
                              <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-zinc-600 mb-2"><span>Impacto XP</span><span>-{(pilot.correctionCount * 60)} PTS</span></div>
                              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-brand" style={{width: `${Math.min(100, (pilot.correctionCount / 5) * 100)}%`}} /></div>
                           </div>
                        </motion.div>
                      )) : (
                        <div className="bg-zinc-950/40 border border-dashed border-zinc-800 py-16 rounded-3xl text-center">
                           <CheckCircle2 size={32} className="mx-auto text-zinc-800 mb-4" />
                           <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest px-10">Nenhum alerta técnico registrado</p>
                        </div>
                      )}
                   </div>

                   <div className="mt-10 p-6 bg-brand/5 rounded-2xl border border-brand/10">
                      <div className="flex items-center gap-3 mb-3">
                         <ShieldAlert size={16} className="text-brand" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-white">Lembrete de Qualidade</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-zinc-500 uppercase font-bold text-justify">Pedidos de ajuste impactam diretamente a posição do profissional no ranking, mesmo após a resolução.</p>
                   </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* PERFORMANCE TAB */}
          {activeTab === 'metrics' && (
            <motion.div key="metrics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-16 pb-20">
               <header className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-b border-zinc-900 pb-10">
                  <div>
                    <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">DADOS DE <span className="text-brand">BASE.</span></h2>
                    <p className="text-zinc-500 uppercase font-bold tracking-[0.4em] text-[10px] mt-4">Metas e Eficiência por Profissional</p>
                  </div>
                  <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 border-l-4 border-l-yellow-400">
                    <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Liderança de Satisfação</div>
                    <div className="text-3xl font-black uppercase text-white leading-none">{pilotCards.find(p => p.satisfAvg === Math.max(...pilotCards.map(x => x.satisfAvg)))?.name || "---"}</div>
                  </div>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pilotCards.map((pilot, idx) => (
                    <motion.div key={pilot.id} whileHover={{ y: -5 }} className="card p-10 group bg-zinc-900/40">
                      <div className="absolute top-0 left-0 bottom-0 bg-brand/[0.03] transition-all duration-1000" style={{ width: `${(pilot.xp / 1000) * 100}%` }} />
                      <div className="flex items-start justify-between relative z-10 mb-8">
                         <div className="flex gap-4">
                            <div className="w-14 h-14 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center font-black text-2xl text-brand">{idx + 1}</div>
                            <div>
                               <div className="text-2xl font-black uppercase tracking-tight">{pilot.name}</div>
                               <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{units.find(u => u.id === pilot.unitId)?.name}</div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-4xl font-black text-brand leading-none text-glow">{pilot.xp}</div>
                            <div className="text-[8px] font-bold uppercase tracking-tighter text-zinc-600">PROFESSIONAL XP</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 relative z-10">
                         {[
                           { label: 'PONTUALIDADE', val: pilot.punctRate, icon: Timer, color: 'text-blue-400' },
                           { label: 'SATISFAÇÃO', val: pilot.satisfAvg * 20, icon: Star, color: 'text-yellow-400' },
                           { label: 'RECOMENDAÇÃO', val: pilot.recRate, icon: ThumbsUp, color: 'text-emerald-400' },
                           { label: 'OFERTA COMERCIAL', val: pilot.offerRate, icon: Zap, color: 'text-brand' },
                         ].map(stat => (
                           <div key={stat.label} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                              <div className="flex items-center gap-2 mb-3"><stat.icon size={12} className={stat.color} /><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span></div>
                              <div className="flex items-end justify-between">
                                 <div className="text-2xl font-black leading-none">{stat.val.toFixed(0)}%</div>
                                 <div className="w-10 h-1 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full ${stat.color.replace('text', 'bg')}`} style={{ width: `${stat.val}%` }} /></div>
                              </div>
                           </div>
                         ))}
                      </div>

                      <div className="flex flex-wrap gap-2 relative z-10 min-h-[40px] mt-8 pt-8 border-t border-zinc-800">
                         {pilot.medals.map(m => (<div key={m.id} className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 group/medal text-[10px] font-bold uppercase tracking-wider"><m.icon size={12} className={m.color} /> {m.label}</div>))}
                         {pilot.correctionCount > 0 && <div className="flex items-center gap-2 bg-brand/10 px-3 py-2 rounded-lg border border-brand/20 text-[10px] font-bold text-brand uppercase tracking-wider"><ShieldAlert size={12} /> {pilot.correctionCount} AJUSTES</div>}
                      </div>
                    </motion.div>
                  ))}
               </div>

               {/* CENTRO DE RETORNOS */}
               <section className="space-y-10 mt-28">
                  <header className="flex items-center justify-between border-b border-zinc-900 pb-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center border border-brand/20 text-brand"><ShieldAlert size={32} /></div>
                      <div>
                        <h3 className="text-3xl font-black tracking-tight uppercase leading-none">CENTRO DE <span className="text-brand">AJUSTES.</span></h3>
                        <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-3">Acompanhamento de Satisfação Pendente</p>
                      </div>
                    </div>
                    <div className="bg-zinc-900 px-8 py-3 rounded-2xl border border-zinc-800 shadow-xl">
                       <span className="text-white font-black text-xl uppercase">{followUpList.length} PENDENTES</span>
                    </div>
                  </header>

                  {followUpList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {followUpList.map((item, idx) => (<motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="card p-8 group border-l-4 border-l-brand hover:bg-zinc-800/20 transition-all"><div className="relative z-10"><div className="flex justify-between items-start mb-6"><div className="text-xl font-black uppercase text-white tracking-tight leading-none">{item.clientName}</div><div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest"><Clock size={12} /> {new Date(item.date).toLocaleDateString('pt-BR')}</div></div><div className="space-y-4 bg-zinc-950/40 p-5 rounded-xl border border-zinc-800/50"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b border-zinc-900 pb-3"><span className="text-zinc-500">Profissional</span><span className="text-white font-black">{barbers.find(b => b.id === item.barberId)?.name}</span></div><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b border-zinc-900 pb-3"><span className="text-zinc-500">Unidade</span><span className="text-white font-black">{units.find(u => u.id === item.unitId)?.name}</span></div><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest"><span className="text-zinc-500">Satisfação</span><span className="flex gap-1.5">{Array.from({length: 5}).map((_, i) => (<Star key={i} size={10} className={i < item.satisfactionLevel ? 'text-yellow-400' : 'text-zinc-800'} fill={i < item.satisfactionLevel ? 'currentColor' : 'none'} />))}</span></div></div><div className="mt-8"><button onClick={() => { if(window.confirm(`Marcar retorno de ${item.clientName} como resolvido?`)) { setEvaluations(evaluations.map(e => e.id === item.id ? {...e, needsFollowUp: false} : e)); } }} className="w-full bg-zinc-950 hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest py-4 rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2 group/btn"><CheckCircle2 size={16} className="text-zinc-500 group-hover/btn:text-green-500 transition-colors" /> Resolver Pedido</button></div></div></motion.div>))}</div>
                  ) : (<div className="bg-zinc-950/30 border-2 border-dashed border-zinc-900 py-32 rounded-3xl text-center"><CheckCircle2 size={48} className="mx-auto text-zinc-800 mb-6" /><div className="text-2xl font-bold uppercase tracking-[0.2em] text-zinc-700">Todos os ajustes realizados</div></div>)}
               </section>
            </motion.div>
          )}

          {/* AVALIAÇÕES */}
          {activeTab === 'feedback' && (
            <motion.div key="feed" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-12 pb-32">
              <header className="text-center">
                <span className="text-brand font-black uppercase tracking-[0.5em] text-xs">Novo Atendimento</span>
                <h2 className="text-6xl font-black tracking-tighter uppercase mt-4">PRONTUÁRIO DE <span className="text-brand">SERVIÇO.</span></h2>
              </header>
              <form onSubmit={handleSubmitEval} className="space-y-8">
                <div className="space-y-8 bg-zinc-900/40 p-12 rounded-3xl border border-zinc-900 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-4 text-brand font-black uppercase tracking-widest text-[11px] border-b border-zinc-800 pb-6"><Calendar size={20}/> 01 — Identificação Base</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4"><label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Nome do Cliente</label><input type="text" className="input-field" value={newEval.clientName} onChange={e => setNewEval({...newEval, clientName: e.target.value})} required /></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4"><label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Data Atend.</label><input type="date" className="input-field text-xs uppercase" value={newEval.serviceDate} onChange={e => setNewEval({...newEval, serviceDate: e.target.value})} required /></div>
                      <div className="space-y-4"><label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Horário</label><input type="text" className="input-field text-xs uppercase" value={newEval.serviceTime} onChange={e => setNewEval({...newEval, serviceTime: e.target.value})} placeholder="ex 14:00" required /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4"><label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Unidade</label><select className="input-field font-bold uppercase" value={newEval.unitId} onChange={e => setNewEval({...newEval, unitId: e.target.value, barberId: ''})} required><option value="">Selecione a Base...</option>{units.map(u => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}</select></div>
                    <div className="space-y-4"><label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Profissional</label><select className="input-field font-bold uppercase" value={newEval.barberId} onChange={e => setNewEval({...newEval, barberId: e.target.value})} required disabled={!newEval.unitId}><option value="">Selecione o Nome...</option>{barbers.filter(b => b.unitId === newEval.unitId).map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}</select></div>
                  </div>

                  <div className="flex items-center gap-4 text-brand font-black uppercase tracking-widest text-[11px] border-b border-zinc-800 pb-6 pt-10"><Timer size={20}/> 02 — Pontualidade e Percepção</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {[
                      { l: 'Chegada no Horário?', f: 'clientArrivalStatus', ops: ['SIM', 'ATRASADO', 'NÃO COMPARECEU'] },
                      { l: 'Início do Serviço?', f: 'serviceStartStatus', ops: ['SIM', 'COM ATRASO', 'ADIANTADO'] }
                    ].map(q => (
                      <div key={q.l} className="space-y-4">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-center block">{q.l}</label>
                        <div className="flex gap-2">
                          {q.ops.map(o => (<button key={o} type="button" onClick={() => setNewEval({...newEval, [q.f]: o as any})} className={`flex-1 py-4 rounded-xl border font-bold text-[10px] uppercase transition-all ${newEval[q.f as keyof Evaluation] === o ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}>{o}</button>))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6 pt-10">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-center block">Nível de Satisfação (1 — 5)</label>
                    <div className="flex justify-center gap-5">
                      {[1,2,3,4,5].map(v => (<button key={v} type="button" onClick={() => setNewEval({...newEval, satisfactionLevel: v})} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-black text-4xl transition-all border-2 ${newEval.satisfactionLevel === v ? 'bg-brand border-brand text-white shadow-2xl scale-110' : 'bg-zinc-950 border-zinc-800 text-zinc-800 hover:border-zinc-700 hover:text-zinc-400'}`}>{v}</button>))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-brand font-black uppercase tracking-widest text-[11px] border-b border-zinc-800 pb-6 pt-10"><ShoppingBag size={20}/> 03 — Comercial e Retenção</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {[
                      { l: 'O Cliente Recomendaria?', f: 'wouldRecommend' },
                      { l: 'Necessita Pedido de Ajuste?', f: 'needsFollowUp' }
                    ].map(q => (
                      <div key={q.l} className="space-y-4">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-center block">{q.l}</label>
                        <div className="flex gap-4">
                           <button type="button" onClick={() => setNewEval({...newEval, [q.f]: true})} className={`flex-1 py-4 rounded-xl border font-black text-xs transition-all ${newEval[q.f as keyof Evaluation] === true ? 'bg-brand border-brand text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700'}`}>SIM</button>
                           <button type="button" onClick={() => setNewEval({...newEval, [q.f]: false})} className={`flex-1 py-4 rounded-xl border font-black text-xs transition-all ${newEval[q.f as keyof Evaluation] === false ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700'}`}>NÃO</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4"><label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-center block">Ofertada Assinatura?</label><div className="flex gap-4"><button type="button" onClick={() => setNewEval({...newEval, offeredSubscription: true})} className={`flex-1 py-4 rounded-xl border font-black text-xs transition-all ${newEval.offeredSubscription === true ? 'bg-brand border-brand text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700'}`}>SIM</button><button type="button" onClick={() => setNewEval({...newEval, offeredSubscription: false})} className={`flex-1 py-4 rounded-xl border font-black text-xs transition-all ${newEval.offeredSubscription === false ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700'}`}>NÃO</button></div></div>
                     <div className="space-y-4"><label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Interesse na Assinatura</label><div className="grid grid-cols-2 gap-2">{['ALTO', 'MÉDIO', 'BAIXO', 'NENHUM'].map(s => (<button key={s} type="button" onClick={() => setNewEval({...newEval, subscriptionInterest: s as any})} className={`py-4 rounded-xl border font-bold text-[9px] uppercase transition-all ${newEval.subscriptionInterest === s ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700 hover:text-zinc-500'}`}>{s}</button>))}</div></div>
                  </div>
                </div>
                <div className="pt-8"><button type="submit" className="btn-primary w-full py-12 text-2xl uppercase tracking-widest flex items-center justify-center gap-6 group"><Save size={32} className="group-hover:scale-110 transition-transform" /> Gravar Registro Telemetria</button></div>
              </form>
            </motion.div>
          )}

          {/* TEAM */}
          {activeTab === 'team' && (
            <motion.div key="team" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-20 pb-32">
               <header className="flex items-center gap-8 border-b border-zinc-900 pb-12">
                 <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-xl border border-zinc-800 text-brand"><Users size={32} /></div>
                 <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">EQUIPE & <span className="text-brand">BASE.</span></h1>
               </header>
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
                  <div className="space-y-12">
                    <h3 className="text-2xl font-black uppercase text-zinc-400 tracking-tight flex items-center gap-4"><MapPin className="text-brand" size={24}/> Unidades Operacionais</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">{units.map(u => (<div key={u.id} className="card p-12 group hover:border-brand/40 transition-colors"><Flag className="absolute right-[-20px] top-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" size={140}/><div className="text-4xl font-black uppercase leading-tight mb-4 tracking-tighter">{u.name}</div><div className="text-[10px] font-bold tracking-[0.4em] text-zinc-600 uppercase">Unidade Ativa</div></div>))}</div>
                  </div>
                  <div className="space-y-12">
                    <h3 className="text-2xl font-black uppercase text-zinc-400 tracking-tight flex items-center gap-4"><Scissors className="text-brand" size={24}/> Time Técnico</h3>
                    <div className="card p-10 bg-zinc-950/40">
                      <form onSubmit={handleAddBarber} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 pb-16 border-b border-zinc-900">
                        <input type="text" placeholder="Nome..." className="input-field text-sm font-bold uppercase" value={newBarber.name} onChange={e => setNewBarber({...newBarber, name: e.target.value})} required />
                        <select className="input-field text-sm font-bold uppercase" value={newBarber.unitId} onChange={e => setNewBarber({...newBarber, unitId: e.target.value})} required><option value="">Base...</option>{units.map(u => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}</select>
                        <button type="submit" className="bg-brand text-white font-black uppercase text-sm rounded-xl py-4 shadow-xl hover:bg-red-700 transition-all">Novo Membro</button>
                      </form>
                      <div className="grid grid-cols-1 gap-4 h-[600px] overflow-y-auto pr-4 no-scrollbar">
                        {barbers.map(b => (
                          <div key={b.id} className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-brand/40 transition-all group">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-brand font-black text-xl shadow-lg border border-zinc-800">{b.name.substring(0,2)}</div>
                              <div><div className="text-2xl font-black uppercase leading-none mb-2 tracking-tight">{b.name}</div><div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{units.find(u => u.id === b.unitId)?.name}</div></div>
                            </div>
                            <button onClick={() => { if(window.confirm(`Desativar ${b.name}?`)) setBarbers(barbers.filter(x => x.id !== b.id)) }} className="w-12 h-12 flex items-center justify-center text-zinc-800 hover:text-brand transition-all backdrop-blur-md rounded-xl hover:bg-brand/10 border border-transparent hover:border-brand/20"><Trash2 size={22}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} 
            className="fixed bottom-12 right-12 z-[100] bg-brand text-white p-12 rounded-3xl font-black uppercase text-2xl tracking-[0.2em] shadow-[0_40px_80px_rgba(220,38,38,0.4)] border border-white/20">
            🏁 REGISTRO ARQUIVADO!
          </motion.div>
        )}
      </main>
    </div>
  );
}
