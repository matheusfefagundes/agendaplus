export type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  duracaoMinutos: number;
  valor: number;
  ativo: boolean;
};
