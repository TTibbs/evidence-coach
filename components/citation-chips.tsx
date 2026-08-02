"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

export type CitationSource = {
  id: string;
  label?: string;
  title: string;
  excerpt?: string;
  url?: string;
  meta?: string;
};

const HOVER_CLOSE_DELAY_MS = 150;

type CitationHoverContextValue = {
  /** Unique per chip mount (`useId`), not `source.id`. */
  openChipId: string | null;
  setOpenChipId: (chipId: string | null) => void;
  scheduleClose: (chipId: string) => void;
  cancelClose: () => void;
};

const CitationHoverContext = createContext<CitationHoverContextValue | null>(
  null,
);

function useCitationHoverGroup() {
  return useContext(CitationHoverContext);
}

export type CitationHoverProviderProps = {
  children: ReactNode;
};

/** Coordinates hover previews so only one citation chip is open at a time. */
export function CitationHoverProvider({
  children,
}: CitationHoverProviderProps) {
  const [openChipId, setOpenChipId] = useState<string | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  }, []);

  const scheduleClose = useCallback(
    (chipId: string) => {
      cancelClose();
      closeTimeout.current = setTimeout(() => {
        setOpenChipId((current) => (current === chipId ? null : current));
        closeTimeout.current = null;
      }, HOVER_CLOSE_DELAY_MS);
    },
    [cancelClose],
  );

  const setOpenChipIdImmediate = useCallback(
    (chipId: string | null) => {
      cancelClose();
      setOpenChipId(chipId);
    },
    [cancelClose],
  );

  useEffect(() => () => cancelClose(), [cancelClose]);

  const value = useMemo(
    () => ({
      openChipId,
      setOpenChipId: setOpenChipIdImmediate,
      scheduleClose,
      cancelClose,
    }),
    [openChipId, setOpenChipIdImmediate, scheduleClose, cancelClose],
  );

  return (
    <CitationHoverContext.Provider value={value}>
      {children}
    </CitationHoverContext.Provider>
  );
}

export type CitationChipProps = {
  source: CitationSource;
  index?: number;
  active?: boolean;
  openOnHover?: boolean;
  onSourceClick?: (source: CitationSource) => void;
  className?: string;
};

function resolveChipLabel(source: CitationSource, index?: number): string {
  if (source.label) return source.label;
  if (index != null) return `[${index + 1}]`;
  return `[${source.id}]`;
}

function CitationPreview({
  source,
  onSourceClick,
}: {
  source: CitationSource;
  onSourceClick?: (source: CitationSource) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium leading-snug">{source.title}</p>
        {source.meta ? (
          <p className="text-xs text-muted-foreground">{source.meta}</p>
        ) : null}
      </div>
      {source.excerpt ? (
        <>
          <Separator />
          <ScrollArea className="max-h-40">
            <p className="pr-3 text-xs leading-relaxed text-muted-foreground">
              {source.excerpt}
            </p>
          </ScrollArea>
        </>
      ) : null}
      {source.url ? (
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full justify-center gap-1.5"
          render={
            <Link
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSourceClick?.(source)}
            />
          }
        >
          Open source
          <ExternalLink data-icon="inline-end" />
        </Button>
      ) : null}
    </div>
  );
}

export function CitationChip({
  source,
  index,
  active = false,
  openOnHover = true,
  onSourceClick,
  className,
}: CitationChipProps) {
  const chipId = useId();
  const hoverGroup = useCitationHoverGroup();
  const [localOpen, setLocalOpen] = useState(false);
  const localCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInTriggerRef = useRef(false);
  const pointerInContentRef = useRef(false);

  const isGrouped = hoverGroup != null && openOnHover;
  const open = isGrouped ? hoverGroup.openChipId === chipId : localOpen;

  const clearLocalCloseTimeout = useCallback(() => {
    if (localCloseTimeout.current) {
      clearTimeout(localCloseTimeout.current);
      localCloseTimeout.current = null;
    }
  }, []);

  const resetPointerRefs = useCallback(() => {
    pointerInTriggerRef.current = false;
    pointerInContentRef.current = false;
  }, []);

  const syncPointerHover = useCallback(() => {
    if (!openOnHover) return;

    const inside = pointerInTriggerRef.current || pointerInContentRef.current;

    if (isGrouped) {
      if (inside) {
        hoverGroup.cancelClose();
        hoverGroup.setOpenChipId(chipId);
      } else {
        hoverGroup.scheduleClose(chipId);
      }
      return;
    }

    if (inside) {
      clearLocalCloseTimeout();
      setLocalOpen(true);
      return;
    }

    clearLocalCloseTimeout();
    localCloseTimeout.current = setTimeout(() => {
      setLocalOpen(false);
      localCloseTimeout.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  }, [chipId, clearLocalCloseTimeout, hoverGroup, isGrouped, openOnHover]);

  const setPointerInTrigger = useCallback(
    (inside: boolean) => {
      pointerInTriggerRef.current = inside;
      syncPointerHover();
    },
    [syncPointerHover],
  );

  const setPointerInContent = useCallback(
    (inside: boolean) => {
      pointerInContentRef.current = inside;
      syncPointerHover();
    },
    [syncPointerHover],
  );

  useEffect(() => () => clearLocalCloseTimeout(), [clearLocalCloseTimeout]);

  const dismiss = useCallback(() => {
    resetPointerRefs();
    if (isGrouped) {
      hoverGroup.cancelClose();
      hoverGroup.setOpenChipId(null);
      return;
    }
    clearLocalCloseTimeout();
    setLocalOpen(false);
  }, [clearLocalCloseTimeout, hoverGroup, isGrouped, resetPointerRefs]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (openOnHover) {
        if (!nextOpen) dismiss();
        return;
      }
      setLocalOpen(nextOpen);
    },
    [dismiss, openOnHover],
  );

  const label = resolveChipLabel(source, index);

  const pointerTriggerHandlers = openOnHover
    ? {
        onPointerEnter: () => setPointerInTrigger(true),
        onPointerLeave: () => setPointerInTrigger(false),
      }
    : undefined;

  const pointerContentHandlers = openOnHover
    ? {
        onPointerEnter: () => setPointerInContent(true),
        onPointerLeave: () => setPointerInContent(false),
      }
    : undefined;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            aria-label={`Source: ${source.title}`}
            {...pointerTriggerHandlers}
            onFocus={
              openOnHover
                ? undefined
                : () => {
                    clearLocalCloseTimeout();
                    setLocalOpen(true);
                  }
            }
            onBlur={openOnHover ? undefined : dismiss}
            onClick={() => {
              onSourceClick?.(source);
              if (!openOnHover) handleOpenChange(!open);
            }}
          >
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer font-mono text-[11px] tabular-nums transition-colors",
                active && "border-primary/50 bg-primary/10 text-primary",
              )}
            >
              {label}
            </Badge>
          </button>
        }
      />
      <PopoverContent
        className="w-80 p-3"
        align="start"
        side="top"
        sideOffset={10}
        {...pointerContentHandlers}
      >
        <CitationPreview source={source} onSourceClick={onSourceClick} />
      </PopoverContent>
    </Popover>
  );
}

export type CitationChipsProps = {
  sources: CitationSource[];
  activeIds?: string[];
  openOnHover?: boolean;
  onSourceClick?: (source: CitationSource) => void;
  className?: string;
};

export function CitationChips({
  sources,
  activeIds,
  openOnHover = true,
  onSourceClick,
  className,
}: CitationChipsProps) {
  const hoverGroup = useCitationHoverGroup();

  if (sources.length === 0) return null;

  const chips = (
    <div
      data-slot="citation-chips"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="list"
      aria-label="Sources"
    >
      {sources.map((source, index) => (
        <CitationChip
          key={source.id}
          source={source}
          index={index}
          active={activeIds?.includes(source.id)}
          openOnHover={openOnHover}
          onSourceClick={onSourceClick}
        />
      ))}
    </div>
  );

  if (!openOnHover || hoverGroup) return chips;

  return <CitationHoverProvider>{chips}</CitationHoverProvider>;
}

export type CitationMarkerProps = {
  sourceId: string;
  index: number;
  sources: CitationSource[];
  openOnHover?: boolean;
  onSourceClick?: (source: CitationSource) => void;
  className?: string;
};

export function CitationMarker({
  sourceId,
  index,
  sources,
  openOnHover = true,
  onSourceClick,
  className,
}: CitationMarkerProps) {
  const source = sources.find((item) => item.id === sourceId);
  if (!source) {
    return (
      <sup
        className={cn(
          "mx-0.5 text-[10px] font-medium text-muted-foreground",
          className,
        )}
      >
        [{index + 1}]
      </sup>
    );
  }

  return (
    <CitationChip
      source={source}
      index={index}
      openOnHover={openOnHover}
      onSourceClick={onSourceClick}
      className={cn("align-super", className)}
    />
  );
}
