export type ClienteDetalhe = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  dataNascimento: string | null;
  observacoesClinicas: string | null;
  ativo: boolean;
};
