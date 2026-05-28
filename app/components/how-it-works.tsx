"use client";

import { Fragment } from "react";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const stepVariant: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const steps = [
  {
    number: "01",
    icon: "📸",
    title: "Snap a Photo",
    description: "Take a picture of your fridge or ingredients. AI identifies everything instantly.",
  },
  {
    number: "02",
    icon: "🤖",
    title: "AI Analyzes",
    description: "Gemini processes the image, Claude selects the best recipe for you.",
  },
  {
    number: "03",
    icon: "🍳",
    title: "Cook & Enjoy",
    description: "Follow your personalized recipe and enjoy a home-cooked meal.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28" style={{ backgroundColor: "#f5f5f0" }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#888" }}
          >
            How It Works
          </p>
          <h2
            className="text-3xl md:text-4xl font-medium"
            style={{ color: "#1a1a1a", letterSpacing: "-0.3px" }}
          >
            Ready in 3 steps.
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-start gap-10 md:gap-0"
        >
          {steps.map((step, i) => (
            <Fragment key={step.number}>
              <motion.div
                variants={stepVariant}
                className="flex-1 flex flex-col gap-4"
              >
                <span
                  className="text-4xl font-bold"
                  style={{ color: "#ffa51f" }}
                >
                  {step.number}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{step.icon}</span>
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "#1a1a1a" }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#888" }}
                >
                  {step.description}
                </p>
              </motion.div>

              {/* Arrow — desktop only, between steps */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:flex items-center justify-center w-12 shrink-0 mt-10 text-xl"
                  style={{ color: "#ddd" }}
                >
                  →
                </div>
              )}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
