"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useFileUpload,
  type UseFileUploadOptions,
} from "@/components/file-upload/use-file-upload";

export type FileUploadProps = UseFileUploadOptions & {
  className?: string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FileUpload({
  onUpload,
  accept = "image/*,application/pdf",
  maxSize = 5_000_000,
  maxFiles,
  maxConcurrentUploads,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const [drag, setDrag] = useState(false);
  const reduceMotion = useReducedMotion();

  const { files, addFiles, removeFile, retryFile } = useFileUpload({
    onUpload,
    accept,
    maxSize,
    maxFiles,
    maxConcurrentUploads,
  });

  const isEngaged = files.length > 0;
  const canAddMore = maxFiles == null || files.length < maxFiles;

  const uploadSummary = getUploadSummary(files);

  const limitsLabel = [
    `Files up to ${formatBytes(maxSize)}`,
    maxFiles ? `Maximum ${maxFiles} file${maxFiles === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const stateTransition = reduceMotion
    ? { duration: 0 }
    : {
        duration: 0.18,
        ease: EASE,
      };

  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : {
        layout: {
          duration: 0.22,
          ease: EASE,
        },
        scale: {
          type: "spring" as const,
          stiffness: 420,
          damping: 32,
        },
      };

  const openFilePicker = () => {
    if (!canAddMore) {
      return;
    }

    inputRef.current?.click();
  };

  const handleContainerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isEngaged) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  };

  const resetDragState = () => {
    dragDepthRef.current = 0;
    setDrag(false);
  };

  return (
    <motion.div
      layout
      role={!isEngaged ? "button" : undefined}
      tabIndex={!isEngaged ? 0 : undefined}
      aria-label={!isEngaged ? "Upload files" : undefined}
      animate={{
        scale: reduceMotion || !drag ? 1 : 1.01,
      }}
      transition={layoutTransition}
      onClick={() => {
        if (!isEngaged) {
          openFilePicker();
        }
      }}
      onKeyDown={handleContainerKeyDown}
      onDragEnter={(event) => {
        event.preventDefault();

        dragDepthRef.current += 1;
        setDrag(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();

        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

        if (dragDepthRef.current === 0) {
          setDrag(false);
        }
      }}
      onDragEnd={resetDragState}
      onDrop={(event) => {
        event.preventDefault();
        resetDragState();

        if (!canAddMore) {
          return;
        }

        addFiles(event.dataTransfer.files);
      }}
      className={cn(
        "group/upload relative overflow-hidden rounded-xl border-2 border-dashed",
        "bg-linear-to-br from-background to-muted/40",
        "transition-colors",
        "dark:from-background dark:to-muted/40",
        !isEngaged && [
          "cursor-pointer",
          "hover:border-primary/60 hover:bg-muted/60",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
        ],
        isEngaged && [
          "cursor-default border-primary/40 bg-muted/40",
          "hover:border-primary/50",
        ],
        drag && "border-primary bg-primary/10",
        isEngaged ? "p-4" : "p-10",
        className,
      )}
    >
      <Input
        ref={inputRef}
        type="file"
        multiple={maxFiles !== 1}
        accept={accept}
        className="hidden"
        onChange={(event) => {
          addFiles(event.currentTarget.files);

          // Allows selecting the same file again after removing it.
          event.currentTarget.value = "";
        }}
      />

      <AnimatePresence>
        {drag && (
          <motion.div
            key="drag-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={stateTransition}
            className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-primary/5"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <AnimatePresence initial={false} mode="wait">
          {!isEngaged ? (
            <motion.div
              key="empty-state"
              layout
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={stateTransition}
              className="flex flex-col items-center justify-center gap-3"
            >
              <motion.div
                animate={{
                  scale: reduceMotion || !drag ? 1 : 1.08,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 460,
                        damping: 28,
                      }
                }
                className={cn(
                  "rounded-full bg-primary/10 p-4 text-primary",
                  "transition-colors",
                  "group-hover/upload:bg-primary/15",
                  drag && "bg-primary/20",
                )}
              >
                <AnimatedUploadIcon active={drag} />
              </motion.div>

              <div className="text-center">
                <AnimatePresence initial={false} mode="wait">
                  <motion.p
                    key={drag ? "drop" : "upload"}
                    initial={
                      reduceMotion ? { opacity: 1 } : { opacity: 0, y: 3 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
                    transition={stateTransition}
                    className="text-sm font-medium"
                  >
                    {drag ? "Drop files here" : "Upload your files"}
                  </motion.p>
                </AnimatePresence>

                <p className="mt-1 text-xs text-muted-foreground">
                  Drag and drop or click to browse
                </p>
              </div>

              <p className="text-[11px] text-muted-foreground">{limitsLabel}</p>
            </motion.div>
          ) : (
            <motion.div
              key="file-list"
              layout
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={stateTransition}
              className="space-y-2"
            >
              <motion.div
                layout="position"
                className="flex min-h-7 items-center justify-between gap-3 px-1"
              >
                <p
                  aria-live="polite"
                  className="text-xs text-muted-foreground"
                >
                  {uploadSummary}
                </p>

                {canAddMore && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      openFilePicker();
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Add more
                  </Button>
                )}
              </motion.div>

              <AnimatePresence initial={false} mode="popLayout">
                {files.map((file) => {
                  const progress = clampProgress(file.progress);

                  return (
                    <motion.div
                      layout="position"
                      key={file.id}
                      initial={
                        reduceMotion
                          ? {
                              opacity: 1,
                            }
                          : {
                              opacity: 0,
                              height: 0,
                            }
                      }
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={
                        reduceMotion
                          ? {
                              opacity: 0,
                              height: 0,
                            }
                          : {
                              opacity: 0,
                              height: 0,
                            }
                      }
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              opacity: {
                                duration: 0.16,
                                ease: EASE,
                              },
                              height: {
                                duration: 0.2,
                                ease: EASE,
                              },
                              layout: {
                                duration: 0.2,
                                ease: EASE,
                              },
                            }
                      }
                      className="overflow-hidden"
                    >
                      <div
                        className={cn(
                          "group/file flex min-h-14 items-center gap-3 rounded-lg border p-2",
                          "bg-background/70 backdrop-blur-sm",
                          "transition-colors",
                          "hover:border-muted-foreground/30",
                          file.status === "error" &&
                            "border-destructive/40 bg-destructive/5",
                          file.status === "success" &&
                            "border-emerald-500/40 bg-emerald-500/5",
                        )}
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                          <AnimatePresence initial={false} mode="wait">
                            {file.preview ? (
                              <motion.img
                                key="preview"
                                src={file.preview}
                                alt={`Preview of ${file.file.name}`}
                                initial={
                                  reduceMotion
                                    ? { opacity: 1 }
                                    : {
                                        opacity: 0,
                                        scale: 1.06,
                                      }
                                }
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                }}
                                exit={{ opacity: 0 }}
                                transition={stateTransition}
                                className="size-full object-cover"
                              />
                            ) : (
                              <motion.div
                                key="file-icon"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={stateTransition}
                              >
                                <FileText
                                  className="size-4 text-muted-foreground"
                                  aria-hidden="true"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm leading-5">
                            {file.file.name}
                          </p>

                          <div className="mt-1 h-5">
                            <AnimatePresence initial={false} mode="wait">
                              {file.status === "uploading" ? (
                                <motion.div
                                  key="uploading"
                                  initial={
                                    reduceMotion
                                      ? { opacity: 1 }
                                      : { opacity: 0 }
                                  }
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={stateTransition}
                                  className="flex h-5 items-center gap-2"
                                >
                                  <div
                                    role="progressbar"
                                    aria-label={`Uploading ${file.file.name}`}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(progress)}
                                    className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
                                  >
                                    <motion.div
                                      initial={{ scaleX: 0 }}
                                      animate={{
                                        scaleX: progress / 100,
                                      }}
                                      transition={
                                        reduceMotion
                                          ? { duration: 0 }
                                          : {
                                              duration: 0.18,
                                              ease: "easeOut",
                                            }
                                      }
                                      className="h-full origin-left bg-primary"
                                    />
                                  </div>

                                  <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                                    {Math.round(progress)}%
                                  </span>
                                </motion.div>
                              ) : file.status === "error" ? (
                                <motion.p
                                  key="error"
                                  initial={
                                    reduceMotion
                                      ? { opacity: 1 }
                                      : { opacity: 0 }
                                  }
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={stateTransition}
                                  className="flex h-5 items-center text-[11px] leading-none text-destructive"
                                >
                                  Upload failed
                                </motion.p>
                              ) : file.status === "success" ? (
                                <motion.p
                                  key="success"
                                  initial={
                                    reduceMotion
                                      ? { opacity: 1 }
                                      : { opacity: 0 }
                                  }
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={stateTransition}
                                  className="flex h-5 items-center text-[11px] leading-none text-emerald-600 dark:text-emerald-400"
                                >
                                  Uploaded
                                </motion.p>
                              ) : (
                                <motion.p
                                  key="selected"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={stateTransition}
                                  className="flex h-5 items-center text-[11px] leading-none text-muted-foreground"
                                >
                                  {formatBytes(file.file.size)}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="grid w-25 shrink-0 grid-cols-[1.75rem_2rem_2rem] items-center gap-1">
                          <div className="flex size-7 items-center justify-center">
                            <AnimatePresence initial={false} mode="wait">
                              {file.status === "uploading" ? (
                                <motion.span
                                  key="uploading-icon"
                                  initial={{
                                    opacity: 0,
                                    scale: 0.75,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    rotate: reduceMotion ? 0 : 360,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    scale: 0.75,
                                  }}
                                  transition={
                                    reduceMotion
                                      ? { duration: 0 }
                                      : {
                                          opacity: {
                                            duration: 0.15,
                                          },
                                          scale: {
                                            duration: 0.15,
                                          },
                                          rotate: {
                                            duration: 1,
                                            repeat: Infinity,
                                            ease: "linear",
                                          },
                                        }
                                  }
                                  className="flex size-7 items-center justify-center text-muted-foreground"
                                  aria-hidden="true"
                                >
                                  <LoaderCircle className="size-4" />
                                </motion.span>
                              ) : file.status === "success" ? (
                                <motion.span
                                  key="success-icon"
                                  initial={
                                    reduceMotion
                                      ? { opacity: 1 }
                                      : {
                                          opacity: 0,
                                          scale: 0.65,
                                        }
                                  }
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                  }}
                                  transition={
                                    reduceMotion
                                      ? { duration: 0 }
                                      : {
                                          type: "spring",
                                          stiffness: 500,
                                          damping: 26,
                                        }
                                  }
                                  className="flex size-7 items-center justify-center text-emerald-600 dark:text-emerald-400"
                                  aria-hidden="true"
                                >
                                  <CheckCircle2 className="size-4" />
                                </motion.span>
                              ) : file.status === "error" ? (
                                <motion.span
                                  key="error-icon"
                                  initial={{
                                    opacity: 0,
                                    scale: 0.75,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    scale: 0.75,
                                  }}
                                  transition={stateTransition}
                                  className="flex size-7 items-center justify-center text-destructive"
                                  aria-hidden="true"
                                >
                                  <AlertCircle className="size-4" />
                                </motion.span>
                              ) : (
                                <span key="empty-icon" aria-hidden="true" />
                              )}
                            </AnimatePresence>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Retry ${file.file.name}`}
                            title="Retry upload"
                            disabled={file.status !== "error"}
                            tabIndex={file.status === "error" ? 0 : -1}
                            onClick={(event) => {
                              event.stopPropagation();
                              retryFile(file.id);
                            }}
                            className={cn(
                              "size-8",
                              file.status !== "error" &&
                                "pointer-events-none invisible",
                            )}
                          >
                            <RotateCcw className="size-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${file.file.name}`}
                            title="Remove file"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeFile(file.id);
                            }}
                            className={cn(
                              "size-8",
                              "opacity-100",
                              "sm:opacity-0",
                              "sm:group-hover/file:opacity-100",
                              "sm:group-focus-within/file:opacity-100",
                            )}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function AnimatedUploadIcon({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={
        reduceMotion
          ? { y: 0 }
          : { y: active ? [0, -5, 0] : [0, -3, 0] }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: active ? 0.75 : 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    >
      <Upload className="size-6" strokeWidth={1.75} aria-hidden="true" />
    </motion.div>
  );
}

function clampProgress(progress: number | undefined) {
  if (typeof progress !== "number") {
    return 0;
  }

  return Math.min(100, Math.max(0, progress));
}

function getUploadSummary(files: ReadonlyArray<{ status: string }>) {
  const uploading = files.filter((file) => file.status === "uploading").length;

  const uploaded = files.filter((file) => file.status === "success").length;

  const failed = files.filter((file) => file.status === "error").length;

  const selected = files.length - uploading - uploaded - failed;

  const parts: string[] = [];

  if (selected > 0) {
    parts.push(`${selected} selected`);
  }

  if (uploading > 0) {
    parts.push(`${uploading} uploading`);
  }

  if (uploaded > 0) {
    parts.push(`${uploaded} uploaded`);
  }

  if (failed > 0) {
    parts.push(`${failed} failed`);
  }

  return parts.length
    ? parts.join(", ")
    : `${files.length} file${files.length === 1 ? "" : "s"} selected`;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1000)),
    units.length - 1,
  );

  const value = bytes / 1000 ** unitIndex;
  const formatted =
    unitIndex === 0 || value >= 10
      ? Math.round(value).toString()
      : value.toFixed(1);

  return `${formatted} ${units[unitIndex]}`;
}
