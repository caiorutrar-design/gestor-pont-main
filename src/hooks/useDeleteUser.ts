import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UsuarioService } from "@/domain/usuarios/UsuarioService";
import { useToast } from "@/hooks/use-toast";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, justification }: { userId: string; justification: string }) => 
      UsuarioService.deleteUser(userId, justification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-users"] });
      toast({ title: "Usuário removido", description: "O usuário foi excluído e o acesso removido com sucesso." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir usuário", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
};
