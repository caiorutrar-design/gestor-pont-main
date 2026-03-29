import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CadastroPage from "@/pages/Cadastro";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn(),
    session: null,
    user: null,
    loading: false,
  }),
}));

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe("CadastroPage", () => {
  const renderCadastro = () =>
    render(
      <BrowserRouter>
        <CadastroPage />
      </BrowserRouter>
    );

  it("renderiza o formulário de cadastro", () => {
    renderCadastro();
    expect(screen.getByText("Criar Conta")).toBeInTheDocument();
    expect(screen.getByText("Cadastrar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Seu nome completo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("seu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mínimo 8 caracteres")).toBeInTheDocument();
  });

  it("renderiza link para login", () => {
    renderCadastro();
    expect(screen.getByText("Entre aqui")).toBeInTheDocument();
  });
});
