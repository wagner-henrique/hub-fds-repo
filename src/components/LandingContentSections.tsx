"use client";

import { useEffect, useState } from "react";
import Spaces from "@/components/Spaces";
import Testimonials from "@/components/Testimonials";
import { ScrollReveal } from "@/components/ScrollReveal";
import { FALLBACK_SPACES, FALLBACK_TESTIMONIALS } from "@/lib/landing-fallback";
import type { LandingContentResponse } from "@/types/landing";

type LandingLoadState = "idle" | "loading" | "success" | "error";

const LandingContentSections = () => {
  const [state, setState] = useState<LandingLoadState>("idle");
  const [data, setData] = useState<LandingContentResponse>({
    spaces: FALLBACK_SPACES,
    testimonials: FALLBACK_TESTIMONIALS,
    updatedAt: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadLandingContent = async () => {
      setState("loading");

      try {
        const response = await fetch("/api/landing", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Falha ao carregar conteúdo da landing: ${response.status}`);
        }

        const payload = (await response.json()) as LandingContentResponse;
        setData({
          spaces: payload.spaces?.length ? payload.spaces : FALLBACK_SPACES,
          testimonials: payload.testimonials?.length ? payload.testimonials : FALLBACK_TESTIMONIALS,
          updatedAt: payload.updatedAt ?? null,
        });
        setState("success");
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setData({
          spaces: FALLBACK_SPACES,
          testimonials: FALLBACK_TESTIMONIALS,
          updatedAt: null,
        });
        setState("error");
      }
    };

    loadLandingContent();

    return () => controller.abort();
  }, []);

  return (
    <>
      {state === "loading" && (
        <section className="py-8 bg-white">
          <div className="container mx-auto px-6">
            <p className="text-sm text-muted-foreground">Carregando conteúdo da página...</p>
          </div>
        </section>
      )}

      {state === "error" && (
        <section className="py-6 bg-secondary/30">
          <div className="container mx-auto px-6">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os dados da API no momento.
            </p>
          </div>
        </section>
      )}

      {state !== "loading" && data.spaces.length === 0 && data.testimonials.length === 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="rounded-3xl border border-primary/10 bg-secondary/20 p-8 text-center">
              <h3 className="text-2xl font-bold text-primary">Conteúdo indisponível</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ainda não há dados publicados para os espaços e depoimentos da landing.
              </p>
            </div>
          </div>
        </section>
      )}

      {data.spaces.length > 0 && (
        <ScrollReveal>
          <Spaces spaces={data.spaces} />
        </ScrollReveal>
      )}

      {data.testimonials.length > 0 && (
        <ScrollReveal delay={0.1}>
          <Testimonials testimonials={data.testimonials} />
        </ScrollReveal>
      )}
    </>
  );
};

export default LandingContentSections;