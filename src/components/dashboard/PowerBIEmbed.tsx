import React, { useState, useEffect } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Report } from 'powerbi-client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PBIEmbedProps {
  embedUrl?: string;
  reportId?: string;
  className?: string;
  accessToken?: string; // Optional if using anonymous or service principal
}

const PBIReport: React.FC<PBIEmbedProps> = ({ embedUrl, reportId, className, accessToken }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!embedUrl || !reportId) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-10 w-10 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Relatório não configurado</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
          Configure a URL de incorporação e o Report ID nas configurações do dashboard.
        </p>
      </Card>
    );
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all", className)}>
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px]">
          <Loader2 className="h-8 w-8 text-[#C51B29] animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600 animate-pulse">Carregando Relatório do Power BI...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-50 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
          <h4 className="text-base font-bold text-red-900">Erro ao carregar relatório</h4>
          <p className="text-sm text-red-700 mt-1 max-w-md">{error}</p>
        </div>
      )}

      <div className="aspect-video w-full min-h-[600px] lg:min-h-[750px]">
        <PowerBIEmbed
          embedConfig={{
            type: 'report',
            id: reportId,
            embedUrl: embedUrl,
            accessToken: accessToken || '', // Should handle token generation professionally in prod
            tokenType: models.TokenType.Aad, // Or Embed depending on scenario
            settings: {
              panes: {
                filters: {
                  expanded: false,
                  visible: false
                }
              },
              background: models.BackgroundType.Transparent,
            }
          }}
          eventHandlers={
            new Map([
              ['loaded', () => setLoading(false)],
              ['rendered', () => console.log('Report rendered')],
              ['error', (event) => {
                console.error(event?.detail);
                setError('Verifique se as permissões e o Token de acesso estão corretos.');
                setLoading(false);
              }],
            ])
          }
          cssClassName={"w-full h-full"}
          getEmbeddedComponent={(embeddedReport) => {
             // Use embeddedReport for custom interactions
          }}
        />
      </div>
    </div>
  );
};

export default PBIReport;
