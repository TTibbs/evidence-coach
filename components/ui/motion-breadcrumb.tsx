"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type MotionBreadcrumbItem = {
  id: string;
  label: React.ReactNode;
  href?: string;
  icon?: LucideIcon;
  disabled?: boolean;

  /**
   * Recommended when label is not plain text.
   */
  ariaLabel?: string;
};

export type MotionBreadcrumbDirection = "auto" | "forward" | "backward";

export type MotionBreadcrumbAnimation = {
  duration?: number;
  distance?: number;
  ease?: [number, number, number, number];
};

export type MotionBreadcrumbProps = {
  items: MotionBreadcrumbItem[];
  className?: string;
  listClassName?: string;
  itemClassName?: string;
  currentClassName?: string;

  ariaLabel?: string;
  separator?: React.ReactNode;

  /**
   * Minimum effective value is 3.
   */
  maxItems?: number;

  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;

  direction?: MotionBreadcrumbDirection;
  animation?: MotionBreadcrumbAnimation;

  collapseLabel?: string;

  /**
   * Pass Next.js Link or another compatible link component.
   *
   * @example
   * linkComponent={Link}
   */
  linkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    children?: React.ReactNode;
    "aria-label"?: string;
  }>;

  onNavigate?: (
    item: MotionBreadcrumbItem,
    index: number,
    event: React.MouseEvent<HTMLElement>,
  ) => void;
};

type BreadcrumbEntry =
  | {
      type: "item";
      item: MotionBreadcrumbItem;
      index: number;
    }
  | {
      type: "ellipsis";
    };

const DEFAULT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function getAccessibleLabel(item: MotionBreadcrumbItem) {
  if (item.ariaLabel) {
    return item.ariaLabel;
  }

  if (typeof item.label === "string") {
    return item.label;
  }

  return item.id;
}

export function MotionBreadcrumb({
  items: itemsProp,
  className,
  listClassName,
  itemClassName,
  currentClassName,
  ariaLabel = "Breadcrumb",
  separator = <ChevronRight className="size-3.5" />,
  maxItems = 4,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  direction = "auto",
  animation,
  collapseLabel = "Show all breadcrumb items",
  linkComponent,
  onNavigate,
}: MotionBreadcrumbProps) {
  const items = itemsProp;
  const shouldReduceMotion = useReducedMotion();

  const [internalExpanded, setInternalExpanded] =
    React.useState(defaultExpanded);

  const isExpanded = expanded ?? internalExpanded;

  const resolvedDirection: 1 | -1 =
    direction === "forward"
      ? 1
      : direction === "backward"
      ? -1
      : 1;

  const setExpanded = React.useCallback(
    (nextExpanded: boolean) => {
      if (expanded === undefined) {
        setInternalExpanded(nextExpanded);
      }

      onExpandedChange?.(nextExpanded);
    },
    [expanded, onExpandedChange],
  );

  const safeMaxItems = Math.max(3, maxItems);
  const shouldCollapse = items.length > safeMaxItems && !isExpanded;

  const entries = React.useMemo<BreadcrumbEntry[]>(() => {
    const completeEntries: BreadcrumbEntry[] = items.map((item, index) => ({
      type: "item",
      item,
      index,
    }));

    if (!shouldCollapse) {
      return completeEntries;
    }

    const trailingCount = safeMaxItems - 2;
    const trailingStart = Math.max(1, items.length - trailingCount);

    return [
      completeEntries[0],
      { type: "ellipsis" },
      ...completeEntries.slice(trailingStart),
    ];
  }, [items, safeMaxItems, shouldCollapse]);

  const duration = animation?.duration ?? 0.18;
  const distance = animation?.distance ?? 10;
  const ease = animation?.ease ?? DEFAULT_EASE;

  const transition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : {
        duration,
        ease,
      };

  const itemVariants: Variants = {
    enter: (travelDirection: 1 | -1) => ({
      opacity: 0,
      x: shouldReduceMotion ? 0 : travelDirection * distance,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (travelDirection: 1 | -1) => ({
      opacity: 0,
      x: shouldReduceMotion ? 0 : travelDirection * -distance,
    }),
  };

  const mobileVariants: Variants = {
    enter: (travelDirection: 1 | -1) => ({
      opacity: 0,
      x: shouldReduceMotion ? 0 : travelDirection * distance,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (travelDirection: 1 | -1) => ({
      opacity: 0,
      x: shouldReduceMotion ? 0 : travelDirection * -distance,
    }),
  };

  const renderControl = (
    item: MotionBreadcrumbItem,
    index: number,
    isCurrent: boolean,
    controlClassName?: string,
    leadingContent?: React.ReactNode,
  ) => {
    const Icon = item.icon;

    const content = (
      <span className="flex min-w-0 items-center gap-1.5">
        {leadingContent ??
          (Icon ? (
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
          ) : null)}

        <span className="truncate">{item.label}</span>
      </span>
    );

    const sharedClassName = cn(
      "inline-flex min-w-0 items-center rounded-md px-1.5 py-1",
      "text-sm transition-colors",
      isCurrent
        ? "font-medium text-foreground"
        : "text-muted-foreground hover:text-foreground",
      item.disabled && "pointer-events-none opacity-50",
      itemClassName,
      isCurrent && currentClassName,
      controlClassName,
    );

    if (isCurrent) {
      return (
        <span
          aria-current="page"
          aria-label={getAccessibleLabel(item)}
          className={sharedClassName}
        >
          {content}
        </span>
      );
    }

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      if (item.disabled) {
        event.preventDefault();
        return;
      }

      onNavigate?.(item, index, event);
    };

    if (item.href) {
      const linkProps = {
        href: item.href,
        "aria-label": getAccessibleLabel(item),
        className: sharedClassName,
        onClick: handleClick,
        children: content,
      };

      if (linkComponent) {
        const CustomLink = linkComponent;
        return <CustomLink {...linkProps} />;
      }

      return <a {...linkProps} />;
    }

    return (
      <button
        type="button"
        disabled={item.disabled}
        aria-label={getAccessibleLabel(item)}
        className={sharedClassName}
        onClick={handleClick}
      >
        {content}
      </button>
    );
  };

  const currentItem = items.at(-1);
  const currentIndex = items.length - 1;
  const parentItem = items.at(-2);
  const parentIndex = items.length - 2;

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className={cn("min-w-0", className)}>
      {/* Desktop and tablet */}
      <ol
        className={cn(
          "hidden min-w-0 items-center gap-1 sm:flex",
          listClassName,
        )}
      >
        <AnimatePresence
          initial={false}
          mode="popLayout"
          custom={resolvedDirection}
        >
          {entries.map((entry, visibleIndex) => {
            const key =
              entry.type === "ellipsis" ? "breadcrumb-ellipsis" : entry.item.id;

            const isCurrent =
              entry.type === "item" && entry.index === currentIndex;

            return (
              <motion.li
                key={key}
                layout="position"
                custom={resolvedDirection}
                variants={itemVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="flex min-w-0 items-center gap-1"
              >
                {visibleIndex > 0 && (
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground/60"
                  >
                    {separator}
                  </span>
                )}

                {entry.type === "ellipsis" ? (
                  <button
                    type="button"
                    aria-label={collapseLabel}
                    title={collapseLabel}
                    onClick={() => setExpanded(true)}
                    className={cn(
                      "inline-flex size-7 shrink-0 items-center justify-center",
                      "rounded-md text-muted-foreground",
                      "transition-colors hover:bg-muted hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-ring focus-visible:ring-offset-2",
                    )}
                  >
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </button>
                ) : (
                  renderControl(entry.item, entry.index, isCurrent)
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      {/* Mobile */}
      <div className="min-w-0 overflow-hidden sm:hidden">
        <AnimatePresence initial={false} mode="wait" custom={resolvedDirection}>
          <motion.div
            key={currentItem?.id}
            custom={resolvedDirection}
            variants={mobileVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="flex min-w-0 items-center gap-1"
          >
            {parentItem &&
              renderControl(
                parentItem,
                parentIndex,
                false,
                "max-w-[48%]",
                <ChevronLeft
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />,
              )}

            {parentItem && (
              <span
                aria-hidden="true"
                className="shrink-0 text-muted-foreground/60"
              >
                {separator}
              </span>
            )}

            {currentItem &&
              renderControl(currentItem, currentIndex, true, "min-w-0 flex-1")}
          </motion.div>
        </AnimatePresence>
      </div>
    </nav>
  );
}
