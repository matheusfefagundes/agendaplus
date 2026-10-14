import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Agenda+",
  description: "Como o Agenda+ coleta, usa e protege seus dados.",
};

const NOME_ESTABELECIMENTO = "Espaço Patrícia Fagundes";
const EMAIL_CONTATO = "matheusferreirafagundes23@gmail.com";
const ULTIMA_ATUALIZACAO = "14 de outubro de 2026";

type Secao = {
  titulo: string;
  paragrafos?: string[];
  itens?: string[];
};

const SECOES: Secao[] = [
  {
    titulo: "1. Quem somos",
    paragrafos: [
      `O Agenda+ é o sistema de agendamento online do ${NOME_ESTABELECIMENTO}. Esta política explica quais dados pessoais coletamos, como os usamos e quais são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).`,
    ],
  },
  {
    titulo: "2. Dados que coletamos",
    itens: [
      "Dados de cadastro: nome, e-mail, telefone e senha (guardada apenas de forma criptografada).",
      "Dados de agendamento: serviços escolhidos, datas, horários, observações e pacotes de sessões.",
      "Login com Google: ao entrar com sua conta Google, recebemos apenas seu nome, e-mail e o identificador da conta. Não temos acesso à sua senha do Google.",
      "Dados técnicos: cookies essenciais para manter você conectado com segurança.",
    ],
  },
  {
    titulo: "3. Como usamos seus dados",
    itens: [
      "Criar e gerenciar sua conta e seus agendamentos.",
      "Enviar e-mails sobre sua conta, como a redefinição de senha.",
      "Permitir que você adicione seus agendamentos à agenda do seu celular ou ao Google Agenda.",
      "Organizar a agenda de atendimentos do estabelecimento.",
      "Não vendemos seus dados e não os usamos para publicidade.",
    ],
  },
  {
    titulo: "4. Integração com o Google Agenda",
    paragrafos: [
      "A administradora do estabelecimento pode conectar a própria conta do Google Agenda ao sistema. Com essa permissão, o Agenda+ cria, atualiza e remove na agenda dela apenas os eventos dos agendamentos feitos no sistema (serviço, nome do cliente, horário e observações). O sistema não lê nem altera outros eventos da agenda.",
      "O uso e a transferência das informações recebidas das APIs do Google seguem a Política de Dados do Usuário dos Serviços de API do Google (Google API Services User Data Policy), incluindo os requisitos de Uso Limitado. O acesso pode ser revogado a qualquer momento pelo botão \"Desconectar\" no sistema ou em myaccount.google.com/permissions.",
    ],
  },
  {
    titulo: "5. Com quem compartilhamos",
    paragrafos: ["Seus dados são tratados apenas por serviços necessários para o funcionamento do sistema:"],
    itens: [
      "Hospedagem do site e banco de dados (Vercel e Supabase).",
      "Envio de e-mails (Brevo).",
      "Google, quando você usa o login com Google ou adiciona eventos ao Google Agenda.",
    ],
  },
  {
    titulo: "6. Segurança e armazenamento",
    paragrafos: [
      "Usamos conexões criptografadas (HTTPS), senhas com hash e credenciais de acesso ao Google armazenadas de forma cifrada. Mantemos seus dados enquanto sua conta estiver ativa ou pelo tempo necessário para cumprir obrigações legais.",
    ],
  },
  {
    titulo: "7. Seus direitos",
    paragrafos: [
      "Você pode, a qualquer momento, solicitar acesso, correção, portabilidade ou exclusão dos seus dados, além de revogar consentimentos. Nome, e-mail e telefone podem ser alterados diretamente em Configurações; para os demais pedidos, entre em contato pelo e-mail abaixo.",
    ],
  },
  {
    titulo: "8. Contato",
    paragrafos: [`Dúvidas sobre esta política ou sobre seus dados: ${EMAIL_CONTATO}.`],
  },
];

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-dvh bg-cream px-4 py-10 sm:px-6 sm:py-16">
      <article className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Link href="/login" className="flex w-fit items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream-dark drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <Image src="/images/logo/logo-lotus.png" alt="" width={26} height={26} />
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-brand">Agenda+</span>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Política de Privacidade</h1>
            <p className="mt-2 text-sm text-ink-muted">Última atualização: {ULTIMA_ATUALIZACAO}</p>
          </div>
        </header>

        {SECOES.map((secao) => (
          <section key={secao.titulo} className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink">{secao.titulo}</h2>
            {secao.paragrafos?.map((paragrafo) => (
              <p key={paragrafo} className="leading-relaxed text-ink">
                {paragrafo}
              </p>
            ))}
            {secao.itens && (
              <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-ink">
                {secao.itens.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <footer className="border-t border-input pt-6">
          <Link href="/login" className="text-sm font-bold text-brand hover:opacity-90">
            Voltar para o Agenda+
          </Link>
        </footer>
      </article>
    </main>
  );
}
