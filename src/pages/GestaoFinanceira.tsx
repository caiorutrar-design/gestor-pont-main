import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useEmpresaFilter } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface EmpresaCliente {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  plano: string;
  data_inicio_trial: string;
  data_fim_trial: string;
  trial_ativo: boolean;
  data_assinatura: string;
  status_pagamento: string;
  ultimo_pagamento: string;
  proximo_pagamento: string;
  valor_mensal: number;
}

interface TransacaoB2B {
  id: string;
  empresa_id: string;
  data_pagamento: string;
  valor: number;
  status: string;
  forma_pagamento: string;
  observacoes: string;
}

export default function GestaoFinanceira() {
  const { user } = useAuth();
  const { empresaId, filter } = useEmpresaFilter();
  
  const [clientes, setClientes] = useState<EmpresaCliente[]>([]);
  const [transacoes, setTransacoes] = useState<TransacaoB2B[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state - Nova empresa
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: "", cnpj: "", email: "", telefone: ""
  });
  
  // Form state - Pagamento
  const [pagamento, setPagamento] = useState({
    empresa_id: "", valor: "", observacoes: ""
  });

  useEffect(() => {
    if (empresaId) {
      fetchClientes();
      fetchTransacoes();
    }
  }, [empresaId]);

  const fetchClientes = async () => {
    // Em produção, seria uma tabela de empresas clientes
    // Por agora, mostramos as empresas do sistema + trials
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear para formato de clientes B2B
      const clientesB2B: EmpresaCliente[] = (data || []).map(e => ({
        id: e.id,
        nome: e.nome_fantasia || e.nome,
        cnpj: e.cnpj || '',
        email: e.email,
        plano: e.plano || 'basico',
        data_inicio_trial: e.created_at?.split('T')[0] || '',
        data_fim_trial: e.metadata?.trial_end || '',
        trial_ativo: e.metadata?.trial_ativo || false,
        data_assinatura: e.metadata?.data_assinatura || '',
        status_pagamento: e.metadata?.status_pagamento || 'ativo',
        ultimo_pagamento: e.metadata?.ultimo_pagamento || '',
        proximo_pagamento: e.metadata?.proximo_pagamento || '',
        valor_mensal: e.metadata?.valor_mensal || getValorPlano(e.plano)
      }));
      
      setClientes(clientesB2B);
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransacoes = async () => {
    // Em produção, seria tabela de pagamentos B2B
    setTransacoes([]);
  };

  const getValorPlano = (plano: string) => {
    const valores: Record<string, number> = {
      starter: 49,
      business: 149,
      enterprise: 299
    };
    return valores[plano] || 49;
  };

  const getStatusBadge = (empresa: EmpresaCliente) => {
    // Verifica se está em trial
    if (empresa.trial_ativo && empresa.data_fim_trial) {
      const fimTrial = new Date(empresa.data_fim_trial);
      const agora = new Date();
      const diasRestantes = Math.ceil((fimTrial.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes > 0) {
        return { text: `Trial: ${diasRestantes} dias`, class: 'badge-warning' };
      } else {
        return { text: 'Trial Expirado', class: 'badge-danger' };
      }
    }
    
    // Verifica status de pagamento
    if (empresa.status_pagamento === 'ativo') {
      return { text: 'Ativo', class: 'badge-success' };
    } else if (empresa.status_pagamento === 'pendente') {
      return { text: 'Pendente', class: 'badge-warning' };
    } else if (empresa.status_pagamento === 'inadimplente') {
      return { text: 'Inadimplente', class: 'badge-danger' };
    }
    
    return { text: empresa.plano, class: 'badge-success' };
  };

  const handleAtivarTrial = async (empresaId: string, dias: number) => {
    const fimTrial = new Date();
    fimTrial.setDate(fimTrial.getDate() + dias);

    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          metadata: {
            trial_ativo: true,
            trial_end: fimTrial.toISOString().split('T')[0],
            data_inicio_trial: new Date().toISOString().split('T')[0]
          }
        })
        .eq('id', empresaId);

      if (error) throw error;
      fetchClientes();
    } catch (err) {
      console.error('Error ativando trial:', err);
    }
  };

  const handleRegistrarPagamento = async () => {
    if (!pagamento.empresa_id || !pagamento.valor) return;

    try {
      const empresa = clientes.find(c => c.id === pagamento.empresa_id);
      const novoPagamento = {
        empresa_id: pagamento.empresa_id,
        data_pagamento: new Date().toISOString().split('T')[0],
        valor: parseFloat(pagamento.valor),
        status: 'confirmado',
        forma_pagamento: 'PIX',
        observacoes: pagamento.observacoes
      };

      // Atualiza empresa
      const proximo = new Date();
      proximo.setMonth(proximo.getMonth() + 1);

      await supabase
        .from('empresas')
        .update({
          metadata: {
            status_pagamento: 'ativo',
            ultimo_pagamento: novoPagamento.data_pagamento,
            proximo_pagamento: proximo.toISOString().split('T')[0]
          }
        })
        .eq('id', pagamento.empresa_id);

      alert(`Pagamento de R$ ${pagamento.valor} registrado!`);
      setPagamento({ empresa_id: "", valor: "", observacoes: "" });
      fetchClientes();
    } catch (err) {
      console.error('Error registrando pagamento:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDiasTrialRestantes = (empresa: EmpresaCliente) => {
    if (!empresa.data_fim_trial) return 0;
    const fim = new Date(empresa.data_fim_trial);
    const agora = new Date();
    return Math.max(0, Math.ceil((fim.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // Resumo
  const totalClientes = clientes.length;
  const clientesAtivos = clientes.filter(c => c.status_pagamento === 'ativo').length;
  const clientesTrial = clientes.filter(c => c.trial_ativo).length;
  const receitaMensal = clientes.reduce((sum, c) => sum + (c.status_pagamento === 'ativo' ? c.valor_mensal : 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header-dark">
        <h1 className="page-title">💰 Gestão Comercial B2B</h1>
        <p className="page-subtitle">Controle de clientes, trials e pagamentos do sistema</p>
      </div>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-dark border-l-4 border-l-primary">
          <div className="text-sm text-muted-foreground mb-1">Total Clientes</div>
          <div className="text-3xl font-bold">{totalClientes}</div>
        </Card>

        <Card className="card-dark border-l-4 border-l-success">
          <div className="text-sm text-muted-foreground mb-1">Clientes Ativos</div>
          <div className="text-3xl font-bold text-success">{clientesAtivos}</div>
        </Card>

        <Card className="card-dark border-l-4 border-l-warning">
          <div className="text-sm text-muted-foreground mb-1">Em Trial</div>
          <div className="text-3xl font-bold text-warning">{clientesTrial}</div>
        </Card>

        <Card className="card-dark border-l-4 border-l-success">
          <div className="text-sm text-muted-foreground mb-1">Receita Mensal</div>
          <div className="text-3xl font-bold text-success">{formatCurrency(receitaMensal)}</div>
        </Card>
      </div>

      {/* Registrar Pagamento */}
      <Card className="card-dark">
        <h3 className="text-lg font-semibold mb-4">💳 Registrar Pagamento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="label-dark">Empresa</Label>
            <select 
              className="input-dark w-full"
              value={pagamento.empresa_id}
              onChange={(e) => setPagamento({...pagamento, empresa_id: e.target.value})}
            >
              <option value="">Selecione...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="label-dark">Valor (R$)</Label>
            <Input 
              className="input-dark" 
              type="number"
              placeholder="0.00"
              value={pagamento.valor}
              onChange={(e) => setPagamento({...pagamento, valor: e.target.value})}
            />
          </div>

          <div className="md:col-span-2">
            <Label className="label-dark">Observações</Label>
            <Input 
              className="input-dark" 
              placeholder="Ex: PIX, transferência, etc."
              value={pagamento.observacoes}
              onChange={(e) => setPagamento({...pagamento, observacoes: e.target.value})}
            />
          </div>
        </div>

        <div className="mt-4">
          <Button className="btn-primary-dark" onClick={handleRegistrarPagamento}>
            Confirmar Pagamento
          </Button>
        </div>
      </Card>

      {/* Lista de Clientes */}
      <Card className="card-dark">
        <h3 className="text-lg font-semibold mb-4">🏢 Clientes do Sistema</h3>
        
        {clientes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Valor Mensal</th>
                  <th>Próximo Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => {
                  const status = getStatusBadge(cliente);
                  return (
                    <tr key={cliente.id}>
                      <td>
                        <div className="font-medium">{cliente.nome}</div>
                        <div className="text-sm text-muted-foreground">{cliente.email}</div>
                      </td>
                      <td className="capitalize">{cliente.plano}</td>
                      <td>
                        <Badge className={status.class}>{status.text}</Badge>
                      </td>
                      <td className="text-success font-medium">
                        {formatCurrency(cliente.valor_mensal)}
                      </td>
                      <td className="text-muted-foreground">
                        {cliente.proximo_pagamento 
                          ? new Date(cliente.proximo_pagamento).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {!cliente.trial_ativo && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAtivarTrial(cliente.id, 7)}
                              >
                                Trial 7d
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAtivarTrial(cliente.id, 30)}
                              >
                                Trial 30d
                              </Button>
                            </>
                          )}
                          {cliente.trial_ativo && (
                            <span className="text-sm text-warning">
                              {getDiasTrialRestantes(cliente)} dias restantes
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Planos e Preços */}
      <Card className="card-dark">
        <h3 className="text-lg font-semibold mb-4">📋 Planos e Preços</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-secondary rounded-lg border border-border">
            <div className="text-sm text-muted-foreground mb-1">Básico</div>
            <div className="text-3xl font-bold mb-2">R$ 79<span className="text-sm font-normal">/mês</span></div>
            <div className="text-sm text-muted-foreground">Até 10 colaboradores</div>
          </div>
          
          <div className="p-4 bg-secondary rounded-lg border border-primary">
            <div className="text-sm text-muted-foreground mb-1">Profissional</div>
            <div className="text-3xl font-bold mb-2 text-primary">R$ 199<span className="text-sm font-normal">/mês</span></div>
            <div className="text-sm text-muted-foreground">Até 50 colaboradores</div>
          </div>
          
          <div className="p-4 bg-secondary rounded-lg border border-warning">
            <div className="text-sm text-muted-foreground mb-1">Enterprise</div>
            <div className="text-3xl font-bold mb-2 text-warning">R$ 399<span className="text-sm font-normal">/mês</span></div>
            <div className="text-sm text-muted-foreground">Colaboradores ilimitados</div>
          </div>
        </div>
      </Card>

      {/* Info */}
      <div className="text-center text-sm text-muted-foreground">
        💡 Sistema Gestor de Ponto — {totalClientes} empresas | {formatCurrency(receitaMensal)}/mês
      </div>
    </div>
  );
}