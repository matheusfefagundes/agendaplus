export function mascararTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

// Monta o link do WhatsApp a partir de um telefone brasileiro (DDD+número,
// com ou sem máscara). Retorna null se não houver dígitos suficientes.
export function linkWhatsapp(telefone: string | null): string | null {
  if (!telefone) return null;
  const digitos = somenteDigitos(telefone);
  if (digitos.length < 10) return null;
  return `https://wa.me/55${digitos}`;
}
