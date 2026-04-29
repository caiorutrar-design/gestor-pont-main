import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Planos {
  starter: { nome: string; preco: number; usuarios: string; recursos: string[] };
  business: { nome: string; preco: number; usuarios: string; recursos: string[] };
  enterprise: { nome: string; preco: number; usuarios: string; recursos: string[] };
}

const planos: Planos = {
  starter: {
    nome: "Starter",
    preco: 79,
    usuarios: "Até 10",
    recursos: [
      "Registro de ponto ilimitado",
      "Geolocalização",
      "Relatórios completos",
      "Banco de horas",
      "App para Android/iOS",
      "Suporte por email"
    ]
  },
  business: {
    nome: "Business",
    preco: 199,
    usuarios: "Até 50",
    recursos: [
      "Tudo do Starter",
      "Gerenciamento de equipes",
      "Importação de ponto",
      "Relatórios avançados",
      "Dashboard personalizado",
      "Suporte prioritário"
    ]
  },
  enterprise: {
    nome: "Enterprise",
    preco: 399,
    usuarios: "Ilimitado",
    recursos: [
      "Tudo do Business",
      "Colaboradores ilimitados",
      "Integração com folha",
      "API de integração",
      "Gerente de conta dedicado",
      "SLA de resposta 4h"
    ]
  }
};

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setLoading(false);
  };

  const scrollToPlans = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              ⚡ Nova era no controle de ponto
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Gestão de ponto<br />
              <span className="text-primary">simples e eficiente</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Sistema completo para controlar presença, gerar relatórios e manter sua 
              empresa em conformidade com a Portaria 671. Sem complicações.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="btn-primary-dark text-lg px-8" onClick={scrollToPlans}>
                Começar teste grátis
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Ver demonstração
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              ✨ 14 dias grátis sem cartão de crédito
            </p>
          </div>

          {/* Hero Image/Video Placeholder */}
          <div className="relative rounded-2xl bg-gradient-to-br from-card to-muted/20 p-8 border border-border">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <div className="text-muted-foreground">Dashboard em Dark Mode</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">😰 Controle de ponto手工 é um pesadelo?</h2>
              <ul className="space-y-4">
                {[
                  "Planilha confusa e desatualizada?",
                  "Funcionários esquecendo de bater ponto?",
                  "Relatórios manuais que consomem horas?",
                  "Medo de autuações do Ministry of Labor?",
                  "Custo alto com sistemas legados?"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-destructive mt-1">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h2 className="text-2xl font-bold mb-6">🚀 E se fosse fácil?</h2>
              <ul className="space-y-4">
                {[
                  "Ponto via app em segundos",
                  "Geolocalização automática",
                  "Relatórios em 1 clique",
                  "100% compliant com legislação",
                  "A partir de R$ 79/mês"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-success mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 border-t border-border bg-gradient-to-b from-transparent to-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tudo que você precisa</h2>
            <p className="text-muted-foreground">Recursos pensados para RH e gestores</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "📱", title: "App Inteligente", desc: "Funcionários batem ponto pelo celular.GPS validates location." },
              { icon: "🕐", title: "Banco de Horas", desc: "Acúmulo, débitos e saldovisíveis em tempo real." },
              { icon: "📊", title: "Relatórios", desc: "Exportação em PDF, Excel e AFD para o Ministry." },
              { icon: "🔔", title: "Alertas", desc: "Notificações para atrasos, ausências e aprovações." },
              { icon: "👥", title: "Gestão de Equipes", desc: "Organize por departamento, função ou localização." },
              { icon: "🔒", title: "Seguro e Compliance", desc: "Seus dados protegidos e em dia com a lei." }
            ].map((feature, i) => (
              <Card key={i} className="card-dark p-6 hover:border-primary/50 transition-colors">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Usado por empresas reais</h2>
            <p className="text-muted-foreground">Resultados comprovados no dia a dia</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { metric: "2.500+", label: "Pontos registrados/mês" },
              { metric: "98%", label: "Satisfação dos clientes" },
              { metric: "4.9★", label: "Avaliação na App Store" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="text-4xl font-bold text-primary mb-2">{stat.metric}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💬</div>
              <div>
                <p className="text-lg italic mb-4">
                  "Finalmente um sistema de ponto que nossa equipe consegue usar sem treinamento. 
                  Reduzimos 80% do tempo gasto com gestão de presença."
                </p>
                <div className="font-semibold">— Gestor de RH, Clínica Médica</div>
                <div className="text-sm text-muted-foreground">São Luís, MA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-16 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Planos transparentes</h2>
            <p className="text-muted-foreground">Sem surpresas. Cancele quando quiser.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(planos).map(([key, plan]) => (
              <Card 
                key={key} 
                className={`card-dark p-6 ${
                  key === 'business' ? 'border-primary shadow-lg shadow-primary/10' : ''
                }`}
              >
                {key === 'business' && (
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      Mais popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.nome}</h3>
                  <div className="text-4xl font-bold text-primary mb-1">
                    R$ {plan.preco}
                    <span className="text-base font-normal text-muted-foreground">/mês</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{plan.usuarios} colaboradores</div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.recursos.map((recurso, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-success">✓</span>
                      {recurso}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${key === 'business' ? 'btn-primary-dark' : 'btn-secondary-dark'}`}
                  variant={key === 'business' ? 'default' : 'outline'}
                >
                  Começar trial gratuito
                </Button>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            ✨ Todos planos incluem 14 dias de teste gratuito
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para simplificar?</h2>
          <p className="text-muted-foreground mb-8">
            Comece seu teste gratuito agora. Sem compromisso.
          </p>
          
          {submitted ? (
            <div className="bg-card rounded-2xl p-8 border border-success/50">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">Obrigado pelo interesse!</h3>
              <p className="text-muted-foreground">
                Nossa equipe entrará em contato em até 24h para criar sua conta de trial.
              </p>
            </div>
          ) : (
            <Card className="card-dark p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="label-dark">Seu nome</Label>
                    <Input 
                      className="input-dark" 
                      placeholder="Maria Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="label-dark">Email corporativo</Label>
                    <Input 
                      className="input-dark" 
                      type="email"
                      placeholder="maria@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="label-dark">Nome da empresa</Label>
                  <Input 
                    className="input-dark" 
                    placeholder="Clinica Vida Ltda"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="btn-primary-dark w-full text-lg"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Começar meu teste grátis →'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Ao clicar, você concorda com nossos termos de uso.
                </p>
              </form>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026 Gestor de Ponto. Todos os direitos reservados.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-foreground">Termos</a>
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}