"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CalendarCheck } from "lucide-react";
import { BotaoGoogle } from "@/components/auth/BotaoGoogle";
import { Button } from "@/components/ui/Button";
import { useMutacaoApi } from "@/hooks/useMutacaoApi";
import { toast } from "@/lib/toast";
import { URL_CONECTAR_GOOGLE_AGENDA } from "@/utils/googleAgenda";
import type { IntegracaoGoogleAgenda } from "@/types/google-agenda";

type GoogleAgendaCardProps = {
  integracao: IntegracaoGoogleAgenda | null;
};

export function GoogleAgendaCard({ integracao }: GoogleAgendaCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultado = searchParams.get("googleAgenda");
  const { enviando, executar } = useMutacaoApi();

  useEffect(() => {
    if (!resultado) return;
    if (resultado === "conectado") {
      toast.success("Google Agenda conectado! Os agendamentos futuros estão sendo enviados.");
    } else {
      toast.danger("Não foi possível conectar o Google Agenda. Tente novamente.");
    }
    router.replace("/admin/configuracoes", { scroll: false });
  }, [resultado, router]);

  async function desconectar() {
    await executar(() => fetch("/api/admin/google-agenda", { method: "DELETE" }), {
      mensagemSucesso: "Google Agenda desconectado.",
      mensagemErroPadrao: "Não foi possível desconectar o Google Agenda.",
      aoSucesso: () => router.refresh(),
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-cream-dark p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-ink">Google Agenda</h2>
        <p className="text-sm text-ink-muted">
          Os agendamentos entram automaticamente na sua agenda do Google e do celular. Os cancelados são removidos.
        </p>
      </div>

      {integracao ? (
        <>
          <div className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
            <CalendarCheck size={20} className="shrink-0 text-success" />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-ink">Conectado</p>
              <p className="truncate text-ink-muted">{integracao.email}</p>
            </div>
          </div>
          <Button type="button" size="sm" variant="secondary" loading={enviando} onClick={desconectar}>
            Desconectar
          </Button>
        </>
      ) : (
        <BotaoGoogle href={URL_CONECTAR_GOOGLE_AGENDA} texto="Conectar Google Agenda" />
      )}
    </div>
  );
}
