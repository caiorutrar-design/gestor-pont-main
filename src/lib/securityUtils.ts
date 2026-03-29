/**
 * Security utility functions for handling errors and authorization
 */

/**
 * Maps database/RLS policy errors to user-friendly messages
 * This prevents leaking internal error details to the client
 */
export function mapSecurityError(error: Error | unknown): string {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Check for RLS policy violations
  if (
    errorMessage.includes('policy') ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('row-level security') ||
    errorMessage.includes('rls') ||
    errorMessage.includes('violates row-level security')
  ) {
    return 'Você não tem permissão para realizar esta operação.';
  }
  
  // Check for authentication errors
  if (
    errorMessage.includes('not authenticated') ||
    errorMessage.includes('jwt') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized')
  ) {
    return 'Sua sessão expirou. Por favor, faça login novamente.';
  }
  
  // Check for foreign key violations (related data exists)
  if (
    errorMessage.includes('foreign key') ||
    errorMessage.includes('violates foreign key constraint')
  ) {
    return 'Este registro está vinculado a outros dados e não pode ser modificado.';
  }
  
  // Check for unique constraint violations
  if (
    errorMessage.includes('unique') ||
    errorMessage.includes('duplicate')
  ) {
    return 'Um registro com esses dados já existe.';
  }
  
  // Default generic message
  return 'Ocorreu um erro ao processar sua solicitação.';
}

/**
 * Check if an error is related to authorization/permissions
 */
export function isAuthorizationError(error: Error | unknown): boolean {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  return (
    errorMessage.includes('policy') ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('row-level security') ||
    errorMessage.includes('rls') ||
    errorMessage.includes('not authenticated') ||
    errorMessage.includes('unauthorized')
  );
}
