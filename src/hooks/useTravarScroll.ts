"use client";

import { useEffect } from "react";

export function useTravarScroll(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const anterior = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = anterior.position;
      body.style.top = anterior.top;
      body.style.width = anterior.width;
      body.style.overflow = anterior.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [ativo]);
}
