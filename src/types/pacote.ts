export type Pacote = {
  id: string;
  servicoId: string;
  servicoNome: string;
  quantidadeSessoes: number;
  valor: number;
  validadeDias: number;
  ativo: boolean;
};

export type SaldoServicoPacote = {
  servicoId: string;
  sessoesRestantes: number;
  expiraEm: string;
};

export type SituacaoPacoteCliente ="ativo" | "esgotado" | "expirado" | "cancelado";

export type PacoteCliente = {
  id: string;
  clienteId: string;
  pacoteId: string;
  servicoId: string;
  servicoNome: string;
  quantidadeSessoes: number;
  sessoesUsadas: number;
  sessoesRestantes: number;
  valor: number;
  expiraEm: string;
  ativo: boolean;
  situacao: SituacaoPacoteCliente;
};
