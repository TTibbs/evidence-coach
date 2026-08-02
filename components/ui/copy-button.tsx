"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  children?: ReactNode;
  copiedText?: string;
  copyLabel?: string;
  copiedLabel?: string;
  timeoutMs?: number;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  onCopied?: () => void;
  onCopyError?: (error: unknown) => void;
}

export function CopyButton({
  value,
  children,
  copiedText = "Copied!",
  copyLabel,
  copiedLabel = "Copied",
  timeoutMs = 1500,
  className,
  variant = "outline",
  size = "sm",
  onCopied,
  onCopyError,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is not available.");
      }

      await navigator.clipboard.writeText(value);

      setCopied(true);
      onCopied?.();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, timeoutMs);
    } catch (error) {
      onCopyError?.(error);
    }
  };

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: "easeOut" as const };

  const defaultLabel = children ?? copyLabel;
  const hasDefaultLabel = defaultLabel != null && defaultLabel !== "";
  const labelContent = copied ? copiedText : defaultLabel;
  const hasLabel = hasDefaultLabel;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("inline-flex items-center", hasLabel && "gap-2", className)}
      aria-label={copied ? copiedLabel : copyLabel}
      title={copied ? copiedLabel : copyLabel}
    >
      <span className="relative size-4 shrink-0">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={copied ? "check" : "copy"}
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, scale: 0.75, rotate: -12 }
            }
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.75, rotate: 12 }
            }
            transition={transition}
            className="absolute inset-0"
          >
            <HugeiconsIcon
              icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
              strokeWidth={2}
            />
          </motion.span>
        </AnimatePresence>
      </span>

      {hasLabel ? (
        <motion.span layout transition={transition}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={copied ? "copied" : "default"}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
              transition={transition}
              className="block whitespace-nowrap"
            >
              {labelContent}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      ) : null}
    </Button>
  );
}
