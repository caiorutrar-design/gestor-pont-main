import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/Login";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn(),
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
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        })),
      })),
    })),
  },
}));

describe("LoginPage", () => {
  const renderLogin = () =>
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

  it("renderiza o formulário de login", () => {
    renderLogin();
    expect(screen.getByText(/Gestão Portuária/i)).toBeInTheDocument();
    expect(screen.getByText("Acessar Sistema")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: 123456")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("renderiza link para cadastro", () => {
    renderLogin();
    expect(screen.getByText("Criar Nova Conta")).toBeInTheDocument();
  });
});
