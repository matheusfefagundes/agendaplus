// Sem tipos publicados pelo pacote (nem em @types); declaração mínima para a
// única chamada que usamos.
declare module "heic-convert" {
  type OpcoesConversao = {
    buffer: Buffer | ArrayBuffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  function convert(opcoes: OpcoesConversao): Promise<ArrayBuffer>;

  export default convert;
}
