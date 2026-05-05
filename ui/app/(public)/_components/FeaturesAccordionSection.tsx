"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useReducedMotion } from "../_hooks/useReducedMotion";

import styles from "./features-accordion-section.module.scss";
import { PauseButton } from "./PauseButton";

const AUTOPLAY_INTERVAL = 6000;
const ILLUSTRATION_SIZES = "(max-width: 768px) calc(100vw - 32px), (max-width: 1024px) 480px, 587px";
const ILLUSTRATION_WIDTH = 490;
const ILLUSTRATION_HEIGHT = 483;

export type FeatureAccordionFeature = {
  id: string;
  label: string;
  description: NonNullable<ReactNode>;
};

type FeatureAccordionProps = {
  title: ReactNode;
  features: readonly [FeatureAccordionFeature, ...FeatureAccordionFeature[]];
  imgAlt: string;
  imgPath: string;
};

type AccordionItemProps = {
  feature: FeatureAccordionFeature;
  index: number;
  isActive: boolean;
  animationActive: boolean;
  cycleKey: number;
  onToggle: (index: number, expanded: boolean) => void;
  imgAlt: string;
  imgPath: string;
};

function AccordionItem({
  feature,
  index,
  isActive,
  animationActive,
  cycleKey,
  onToggle,
  imgAlt,
  imgPath,
}: AccordionItemProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [titleHeight, setTitleHeight] = useState<number | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const button = wrapper.querySelector<HTMLElement>(".fr-accordion__btn");
    if (!button) return;

    const updateTitleHeight = () => {
      setTitleHeight(button.getBoundingClientRect().height);
    };

    updateTitleHeight();

    const resizeObserver = new ResizeObserver(updateTitleHeight);
    resizeObserver.observe(button);

    return () => resizeObserver.disconnect();
  }, []);

  const progressBarClassName = [
    styles.progressBar,
    isActive ? styles.progressBarActive : "",
    isActive && !animationActive ? styles.progressBarPaused : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={wrapperRef} className={styles.accordionWrapper}>
      <div
        key={isActive ? `active-${cycleKey}` : `idle-${index}`}
        className={progressBarClassName}
        style={titleHeight != null ? { height: `${titleHeight}px` } : undefined}
        aria-hidden="true"
      />
      <Accordion label={feature.label} expanded={isActive} onExpandedChange={(expanded) => onToggle(index, expanded)}>
        <div className={styles.illustrationMobileWrapper}>
          <Image
            src={`${imgPath}${feature.id}.png`}
            alt={imgAlt}
            width={ILLUSTRATION_WIDTH}
            height={ILLUSTRATION_HEIGHT}
            sizes={ILLUSTRATION_SIZES}
            className={styles.illustrationMobile}
          />
        </div>
        {feature.description}
      </Accordion>
    </div>
  );
}

export function FeaturesAccordionSection({ title, features, imgAlt, imgPath }: FeatureAccordionProps) {
  const [openFeatureIndex, setOpenFeatureIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const [cycleKey, setCycleKey] = useState(0);

  const animationActive = !isPaused && !prefersReducedMotion;

  useEffect(() => {
    if (!animationActive) return;

    const timeout = setTimeout(() => {
      setOpenFeatureIndex((index) => (index + 1) % features.length);
      setCycleKey((key) => key + 1);
    }, AUTOPLAY_INTERVAL);

    return () => clearTimeout(timeout);
  }, [animationActive, features.length, openFeatureIndex]);

  const handleToggle = useCallback((index: number, _expanded: boolean) => {
    setOpenFeatureIndex(index);
    setCycleKey((key) => key + 1);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((paused) => !paused);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <PauseButton
            isPaused={!animationActive}
            togglePause={togglePause}
            style={{
              flexShrink: 0,
              whiteSpace: "nowrap",
              marginTop: "auto",
              marginLeft: "auto",
            }}
          />
        </div>
        <div className={styles.content}>
          <div className={`${styles.accordions} fr-accordions-group`}>
            {features.map((feature, index) => (
              <AccordionItem
                key={feature.id}
                feature={feature}
                index={index}
                isActive={openFeatureIndex === index}
                animationActive={animationActive}
                cycleKey={cycleKey}
                onToggle={handleToggle}
                imgAlt={imgAlt}
                imgPath={imgPath}
              />
            ))}
          </div>
          <div className={styles.illustrationWrapper}>
            <Image
              src={`${imgPath}${features[openFeatureIndex].id}.png`}
              alt={imgAlt}
              width={ILLUSTRATION_WIDTH}
              height={ILLUSTRATION_HEIGHT}
              sizes={ILLUSTRATION_SIZES}
              className={styles.illustration}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
