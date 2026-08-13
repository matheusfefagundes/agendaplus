import Image from "next/image";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  subtitle?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthLayout({ subtitle, footer, children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen w-full items-stretch overflow-hidden bg-cream">
      <div className="relative hidden w-1/2 overflow-hidden bg-cream-dark lg:block">
        <Image
          src="/images/auth/login-hero.png"
          alt=""
          fill
          priority
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream/20 via-cream/0 to-cream" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(101,82,138,0.1)] to-transparent mix-blend-multiply" />
      </div>

      <div className="flex w-full items-center justify-center overflow-hidden bg-cream px-8 py-10 lg:w-1/2 lg:px-24">
        <div className="flex w-full max-w-96 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream-dark drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                <Image src="/icons/logo-leaf.svg" alt="" width={17} height={17} />
              </div>
              <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-brand">
                Agenda+
              </h1>
            </div>
            {subtitle && <p className="text-base leading-[26px] text-ink">{subtitle}</p>}
          </div>

          {children}

          {footer}
        </div>
      </div>
    </div>
  );
}
