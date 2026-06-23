import React from "react";
import { useFaqs } from "../../lib/hooks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export default function Faq() {
  const { data } = useFaqs();
  if (!data) return null;
  return (
    <section id="faq" className="py-20 md:py-28 bg-[#070707]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-3">— Frequently asked —</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {data.map((f) => (
            <AccordionItem key={f.id} value={f.id} className="border-b border-ink-500/60">
              <AccordionTrigger className="text-left font-display text-base sm:text-lg py-5 hover:text-amber-500">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base text-neutral-300 leading-relaxed pb-6">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
