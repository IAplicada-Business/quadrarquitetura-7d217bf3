import { useLayoutEffect, useRef, useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { PortfolioSection } from "@/components/landing/PortfolioSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import type { SiteContent, SiteSectionKey } from "@/lib/siteContent";

/** Largura de desktop em que a seção é renderizada antes de reduzir. */
const PREVIEW_WIDTH = 1280;

function Section({ section, content }: { section: SiteSectionKey; content: SiteContent }) {
  switch (section) {
    case "hero":
      return <HeroSection content={content.hero} />;
    case "about":
      return <AboutSection content={content.about} />;
    case "services":
      return <ServicesSection content={content.services} />;
    case "portfolio":
      return <PortfolioSection content={content.portfolio} />;
    case "contact":
      return <ContactSection content={content.contact} preview />;
    case "footer":
      return <LandingFooter content={content.footer} />;
  }
}

/**
 * Preview da seção com o rascunho: usa os mesmos componentes do site,
 * renderizados em 1280px e reduzidos pra caber na coluna.
 */
export function SitePreview({ section, content }: { section: SiteSectionKey; content: SiteContent }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const s = Math.min(1, outer.clientWidth / PREVIEW_WIDTH) || 0.5;
      setScale(s);
      setHeight(inner.scrollHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [section]);

  return (
    <div ref={outerRef} className="w-full overflow-hidden rounded-md border bg-white" style={{ height: height || undefined }} data-testid="site-preview">
      <div
        ref={innerRef}
        style={{ width: PREVIEW_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
        // Links e botões do preview não navegam.
        onClickCapture={(e) => e.preventDefault()}
      >
        <Section section={section} content={content} />
      </div>
    </div>
  );
}
