"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ConfirmButtonProps {
  label?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  title?: string;
  description?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  /** When true, the trigger and confirm action use destructive styling. Defaults to variant === "destructive". */
  destructive?: boolean;
  disabled?: boolean;
  className?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmButton({
  label = "Confirm",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  title = "Are you sure?",
  description = "Please confirm before continuing.",
  variant = "default",
  size = "sm",
  destructive,
  disabled,
  className,
  onConfirm,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDestructive = destructive ?? variant === "destructive";
  const confirmVariant = isDestructive ? "destructive" : "default";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={size}
            disabled={disabled || loading}
            className={cn(
              isDestructive &&
                "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
              className,
            )}
          >
            {label}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <div className="flex items-start gap-2">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-amber-500"
          />
          <PopoverHeader className="gap-1">
            <PopoverTitle className="text-sm">{title}</PopoverTitle>
            <PopoverDescription className="text-xs">
              {description}
            </PopoverDescription>
          </PopoverHeader>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
