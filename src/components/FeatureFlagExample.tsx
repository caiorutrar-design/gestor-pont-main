import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export const NewDashboardFeature = () => {
  const { data: isEnabled, isLoading } = useFeatureFlag("new_dashboard_v2");

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {isEnabled ? (
        <section className="p-4 bg-green-50 rounded">
          <h2>Novo Dashboard Ativo!</h2>
          {/* Nova lógica aqui */}
        </section>
      ) : (
        <section className="p-4 bg-gray-50 rounded">
          <h2>Dashboard Legado</h2>
          {/* Lógica antiga aqui */}
        </section>
      )}
    </div>
  );
};
