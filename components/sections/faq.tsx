"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "What file types does FixMyDoc support?",
    a: "We support PDF (.pdf) and Microsoft Word (.docx) files up to 5 MB each.",
  },
  {
    q: "Which document types can be analyzed?",
    a: "CVs and resumes, legal documents and briefs, academic papers, and general business documents.",
  },
  {
    q: "How many analyses can I run on the free plan?",
    a: "The free plan includes 1 analysis per day. Upgrade to Pro or Business for unlimited analyses.",
  },
  {
    q: "What export formats are available?",
    a: "All plans can export as plain text (.txt). Pro and Business plans unlock PDF and DOCX export.",
  },
  {
    q: "Is my document data kept private?",
    a: "Yes. Documents are stored securely in private Supabase storage and are only accessible to your account. We do not use your content to train AI models.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Absolutely. You can cancel from the billing portal at any time and you won't be charged again. You keep access until the end of the billing period.",
  },
]

export function Faq() {
  return (
    <section className="border-t border-border px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
