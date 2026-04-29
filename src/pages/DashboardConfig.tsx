import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings2, BarChart3, LineChart, Layout, Save, Info, ExternalLink, ShieldCheck, Database } from "lucide-react";

const DashboardConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Dashboard card toggles
  const [cards, setCards] = useState({
    colaboradores: true,
    orgaos: true,
    pontos: true
  });
  
  const [period, setPeriod] = useState("hoje");
  
  // Power BI Config
  const [pbi, setPbi] = useState({
    enabled: false,
    reportId: "",
    workspaceId: "",
    embedUrl: ""
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('dashboard_settings')
        .select('*')
        .single();
      
      if (data) {
        setCards(data.enabled_cards as any);
        setPeriod(data.default_period || "hoje");
        setPbi({
          enabled: data.powerbi_enabled || false,
          reportId: data.powerbi_report_id || "",
          workspaceId: data.powerbi_workspace_id || "",
          embedUrl: data.powerbi_embed_url || ""
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('dashboard_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          enabled_cards: cards,
          default_period: period,
          powerbi_enabled: pbi.enabled,
          powerbi_report_id: pbi.reportId,
          powerbi_workspace_id: pbi.workspaceId,
          powerbi_embed_url: pbi.embedUrl,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso no banco de dados.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-[#C51B29] border-[#C51B29]/20 bg-[#C51B29]/5">
                Admin Oficial
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-[#0B132B]">Gestão do Dashboard</h1>
            <p className="text-slate-500 mt-1">Configurações avançadas e integração com Power BI.</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-[#C51B29] hover:bg-[#A01622] text-white shadow-lg shadow-red-900/10"
          >
            {saving ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Preferências</>}
          </Button>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 border-slate-200">
            <TabsTrigger value="geral" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings2 className="mr-2 h-4 w-4" /> Configuração Geral
            </TabsTrigger>
            <TabsTrigger value="charts" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-400 opacity-50 cursor-not-allowed">
              <BarChart3 className="mr-2 h-4 w-4" /> Estilo de Gráficos (Beta)
            </TabsTrigger>
            <TabsTrigger value="powerbi" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center">
              <Database className="mr-2 h-4 w-4" /> Relatórios Power BI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-[#0B132B]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layout className="h-5 w-5 text-[#0B132B]" /> Exibição de Cards
                  </CardTitle>
                  <CardDescription>Ative ou desative os blocos estatísticos principais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Card Colaboradores</Label>
                      <p className="text-[10px] text-slate-500">Mostra o total de ativos/inativos.</p>
                    </div>
                    <Switch 
                      checked={cards.colaboradores} 
                      onCheckedChange={(v) => setCards({...cards, colaboradores: v})}
                      className="data-[state=checked]:bg-[#0B132B]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Card Órgãos</Label>
                      <p className="text-[10px] text-slate-500">Mostra distribuição por unidades.</p>
                    </div>
                    <Switch 
                      checked={cards.orgaos} 
                      onCheckedChange={(v) => setCards({...cards, orgaos: v})}
                      className="data-[state=checked]:bg-[#0B132B]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Card Pontos Hoje</Label>
                      <p className="text-[10px] text-slate-500">Exibe evolução diária e total de batidas.</p>
                    </div>
                    <Switch 
                      checked={cards.pontos} 
                      onCheckedChange={(v) => setCards({...cards, pontos: v})}
                      className="data-[state=checked]:bg-[#0B132B]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-[#C51B29]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-[#C51B29]" /> Período e Métricas
                  </CardTitle>
                  <CardDescription>Defina os padrões de visualização de dados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Período Padrão</Label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hoje">Hoje</SelectItem>
                        <SelectItem value="semana">Últimos 7 dias</SelectItem>
                        <SelectItem value="mes">Último mês</SelectItem>
                        <SelectItem value="ano">Ano Atual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3 mt-4">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">Configuração Global</p>
                      <p className="text-[10px] text-amber-800 mt-1 opacity-80 leading-relaxed">
                        Estas mudanças afetarão todos os usuários administrativos que acessarem o Dashboard Principal do sistema.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="powerbi">
            <Card className="border-slate-200 shadow-lg overflow-hidden border-t-8 border-t-[#0B132B]">
              <CardHeader className="bg-slate-100/50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-black italic">
                      Microsoft <span className="text-[#F2C811]">Power BI</span> Integration
                    </CardTitle>
                    <CardDescription>Incorpore painéis avançados do Business Intelligence.</CardDescription>
                  </div>
                  <Switch 
                    checked={pbi.enabled} 
                    onCheckedChange={(v) => setPbi({...pbi, enabled: v})}
                    className="data-[state=checked]:bg-[#F2C811]"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {!pbi.enabled && (
                  <div className="text-center py-8 opacity-40">
                    <Database className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-sm">A integração com Power BI está desativada.</p>
                  </div>
                )}
                
                {pbi.enabled && (
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-bold tracking-tight">Report Embed URL</Label>
                        <Input 
                          placeholder="https://app.powerbi.com/reportEmbed?reportId=..." 
                          value={pbi.embedUrl}
                          onChange={(e) => setPbi({...pbi, embedUrl: e.target.value})}
                          className="font-mono text-xs h-10 border-slate-300 focus:ring-[#C51B29]"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-bold tracking-tight">Report ID</Label>
                        <Input 
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                          value={pbi.reportId}
                          onChange={(e) => setPbi({...pbi, reportId: e.target.value})}
                          className="font-mono text-xs h-10 border-slate-300"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-bold tracking-tight">Workspace (Group) ID</Label>
                        <Input 
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                          value={pbi.workspaceId}
                          onChange={(e) => setPbi({...pbi, workspaceId: e.target.value})}
                          className="font-mono text-xs h-10 border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-yellow-500/20 transition-all"></div>
                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Recomendações de Embed
                        </h4>
                        <ul className="space-y-3 text-xs opacity-80">
                          <li className="flex gap-2">
                            <span className="text-[#F2C811] font-bold">•</span>
                            <span>Use <strong>Service Principal</strong> para evitar logins individuais de usuários.</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-[#F2C811] font-bold">•</span>
                            <span>A URL deve incluir <code>reportId</code> e o Workspace deve possuir licença PRO ou Premium.</span>
                          </li>
                          <li className="flex gap-2 text-emerald-300/90 font-medium">
                            <span className="text-[#F2C811] font-bold">•</span>
                            <span>Suporte oficial para filtros de URL (Dynamic Filtering).</span>
                          </li>
                        </ul>
                        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
                           <a href="https://learn.microsoft.com/en-us/power-bi/developer/embedded/embed-sample-for-customers" target="_blank" className="text-[10px] text-[#F2C811] flex items-center gap-1 hover:underline">
                             Documentação API <ExternalLink className="h-3 w-3" />
                           </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-widest">SIF SAÚDE E PERFORMANCE MA • v3.0.0</span>
                <span className="text-[10px] italic">Powered by Microsoft Azure & Power BI Embedded</span>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default DashboardConfig;
