import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsuarioService, SistemaUser } from "@/domain/usuarios/UsuarioService";
import { useToast } from "@/hooks/use-toast";

export const useUsuariosSistema = () => {
  return useQuery({
    queryKey: ["sistema-users"],
    queryFn: () => UsuarioService.getSistemaUsers(),
  });
};

export const useLinkColaborador = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ colaboradorId, userId }: { colaboradorId: string; userId: string }) => 
      UsuarioService.linkColaboradorToUser(colaboradorId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast({ title: "Sucesso", description: "Colaborador vinculado ao usuário com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao vincular", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
};
