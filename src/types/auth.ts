export type Papel = "admin" | "cliente";

export type PayloadSessao = {
  sub: string;
  role: Papel;
};
