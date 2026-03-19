import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Target, 
  ArrowRight,
  Landmark,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const Financeiro = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "goals">("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Fetch Transactions ---
  const { data: transactionsData = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["finance_transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("finance_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // --- Fetch Goals ---
  const { data: goalsData = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["finance_goals", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("finance_goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const transactions = transactionsData as any[];
  const goals = goalsData as any[];

  // --- Mutation: Add Transaction ---
  const addTransactionMutation = useMutation({
    mutationFn: async (newTransaction: any) => {
      const { error } = await (supabase as any)
        .from("finance_transactions")
        .insert([{ ...newTransaction, user_id: user?.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance_transactions"] });
      toast.success("Transação adicionada com sucesso!");
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao adicionar transação: " + error.message);
    },
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = totalIncome - totalExpense;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      amount: Number(formData.get("amount")),
      type: formData.get("type"),
      category: formData.get("category"),
      description: formData.get("description"),
      date: formData.get("date"),
    };
    addTransactionMutation.mutate(data);
  };

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // --- Mutation: Add Goal ---
  const addGoalMutation = useMutation({
    mutationFn: async (newGoal: any) => {
      const { error } = await (supabase as any)
        .from("finance_goals")
        .insert([{ ...newGoal, user_id: user?.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance_goals"] });
      toast.success("Meta criada com sucesso!");
      setIsGoalModalOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao criar meta: " + error.message);
    },
  });

  const handleGoalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      target_amount: Number(formData.get("target_amount")),
      current_amount: Number(formData.get("current_amount")) || 0,
      deadline: formData.get("deadline") || null,
    };
    addGoalMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-cinzel font-black tracking-tighter italic uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              GESTÃO <span className="text-accent drop-shadow-[0_0_15px_rgba(255,107,0,0.3)]">FINANCEIRA</span>
            </h1>
            <p className="text-muted-foreground mt-2 uppercase tracking-[0.3em] font-medium text-xs md:text-sm">
              Hub Life OS • Central de Controle
            </p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-white px-6 py-6 rounded-2xl font-bold text-sm uppercase flex items-center gap-2 hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
                <Plus size={18} /> Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/5 text-foreground rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-cinzel font-black italic uppercase text-accent">Adicionar Movimentação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-black uppercase tracking-widest text-white/50">Valor (R$)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0,00" className="bg-white/5 border-white/10 rounded-xl h-12 focus:border-accent/40" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-xs font-black uppercase tracking-widest text-white/50">Tipo</Label>
                    <Select name="type" defaultValue="expense">
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-foreground">
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-xs font-black uppercase tracking-widest text-white/50">Data</Label>
                    <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="bg-white/5 border-white/10 rounded-xl h-12 focus:border-accent/40" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-black uppercase tracking-widest text-white/50">Categoria</Label>
                  <Input id="category" name="category" required placeholder="Ex: Alimentação, Lazer..." className="bg-white/5 border-white/10 rounded-xl h-12 focus:border-accent/40" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-white/50">Descrição (Opcional)</Label>
                  <Input id="description" name="description" placeholder="Ex: Almoço no Coliseu" className="bg-white/5 border-white/10 rounded-xl h-12 focus:border-accent/40" />
                </div>

                <Button 
                  type="submit" 
                  disabled={addTransactionMutation.isPending}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-black h-14 rounded-2xl tracking-widest uppercase transition-all"
                >
                  {addTransactionMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : "SALVAR TRANSAÇÃO"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card: Saldo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 border border-border rounded-3xl p-6 relative overflow-hidden group"
          >
            <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors">
              <Wallet size={120} />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                <Landmark size={14} className="text-accent" /> Saldo Atual
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 font-cinzel">
                {formatCurrency(balance)}
              </h2>
            </div>
          </motion.div>

          {/* Card: Receitas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 border border-border rounded-3xl p-6 relative overflow-hidden group"
          >
            <div className="absolute -right-6 -top-6 text-green-500/5 group-hover:text-green-500/10 transition-colors">
              <TrendingUp size={120} />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-green-500" /> Receitas
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 font-cinzel text-green-500">
                {formatCurrency(totalIncome)}
              </h2>
            </div>
          </motion.div>

          {/* Card: Despesas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 border border-border rounded-3xl p-6 relative overflow-hidden group"
          >
            <div className="absolute -right-6 -top-6 text-red-500/5 group-hover:text-red-500/10 transition-colors">
              <TrendingDown size={120} />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                <TrendingDown size={14} className="text-red-500" /> Despesas
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 font-cinzel text-red-500">
                {formatCurrency(totalExpense)}
              </h2>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {["overview", "transactions", "goals"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab 
                  ? "bg-white text-black shadow-lg" 
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {tab === "overview" ? "Visão Geral" : tab === "transactions" ? "Extrato" : "Metas"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border rounded-[2.5rem] p-6 md:p-10 min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {(activeTab === "overview" || activeTab === "transactions") && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-cinzel font-black italic uppercase">Últimas Movimentações</h3>
                  {activeTab === "overview" && (
                     <button onClick={() => setActiveTab("transactions")} className="text-accent text-sm font-bold flex items-center gap-1 hover:underline">
                        Ver todas <ArrowRight size={14}/>
                     </button>
                  )}
                </div>

                {loadingTransactions ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Loader2 size={40} className="animate-spin mb-4" />
                    <p className="font-cinzel tracking-widest uppercase text-xs">Carregando dados...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 uppercase tracking-[0.2em] font-medium text-xs">
                     <AlertCircle size={40} className="mb-4 text-white/20" />
                     Nenhuma movimentação encontrada
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, activeTab === "overview" ? 5 : undefined).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-sm md:text-base">{t.description || t.category}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span className="uppercase tracking-wider">{t.category}</span>
                              <span>•</span>
                              <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`font-cinzel font-bold md:text-lg ${t.type === 'income' ? 'text-green-500' : 'text-foreground'}`}>
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          {/* GOALS TAB */}
          {activeTab === "goals" && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-cinzel font-black italic uppercase">Metas Financeiras</h3>
                
                <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
                  <DialogTrigger asChild>
                    <button className="text-accent text-sm font-bold flex items-center gap-1 hover:underline">
                      <Plus size={14}/> Nova Meta
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-white/5 text-foreground rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-cinzel font-black italic uppercase text-accent">Criar Nova Meta</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGoalSubmit} className="space-y-6 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-white/50">Título da Meta</Label>
                        <Input id="title" name="title" required placeholder="Ex: Reserva de Emergência" className="bg-white/5 border-white/10 rounded-xl h-12" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="target_amount" className="text-xs font-black uppercase tracking-widest text-white/50">Valor Alvo (R$)</Label>
                          <Input id="target_amount" name="target_amount" type="number" step="0.01" required placeholder="0,00" className="bg-white/5 border-white/10 rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="current_amount" className="text-xs font-black uppercase tracking-widest text-white/50">Valor Atual (R$)</Label>
                          <Input id="current_amount" name="current_amount" type="number" step="0.01" defaultValue="0" className="bg-white/5 border-white/10 rounded-xl h-12" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deadline" className="text-xs font-black uppercase tracking-widest text-white/50">Prazo (Opcional)</Label>
                        <Input id="deadline" name="deadline" type="date" className="bg-white/5 border-white/10 rounded-xl h-12" />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={addGoalMutation.isPending}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-black h-14 rounded-2xl tracking-widest uppercase"
                      >
                        {addGoalMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : "CRIAR META"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingGoals ? (
                 <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Loader2 size={40} className="animate-spin mb-4" />
                    <p className="font-cinzel tracking-widest uppercase text-xs">Carregando metas...</p>
                 </div>
              ) : (goals as any[]).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 uppercase tracking-[0.2em] font-medium text-xs">
                   <Target size={40} className="mb-4 text-white/20" />
                   Crie sua primeira meta financeira
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(goals as any[]).map((goal) => {
                    const percent = Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100);
                    return (
                      <div key={goal.id} className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div>
                            <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em] flex items-center gap-1">
                              <Target size={12} /> Objetivo
                            </span>
                            <h4 className="text-lg font-bold mt-1 uppercase italic">{goal.title}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">Progresso</span>
                            <p className="font-cinzel font-bold text-accent text-lg">{percent.toFixed(0)}%</p>
                          </div>
                        </div>

                        <div className="w-full h-3 bg-background rounded-full overflow-hidden mt-6 mb-2 relative z-10 border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-accent rounded-full relative"
                          >
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                          </motion.div>
                        </div>
                        
                        <div className="flex justify-between text-xs font-medium text-white/50 relative z-10">
                          <span>{formatCurrency(Number(goal.current_amount))}</span>
                          <span>{formatCurrency(Number(goal.target_amount))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  </div>
);
};

export default Financeiro;
