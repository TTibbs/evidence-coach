export function toggleSelectedId(selected: string[], id: string) {
  return selected.includes(id)
    ? selected.filter((selectedId) => selectedId !== id)
    : [...selected, id];
}

export function selectMissingIds(selected: string[], ids: string[]) {
  const next = new Set(selected);
  ids.forEach((id) => next.add(id));
  return Array.from(next);
}

export function removeSelectedIds(selected: string[], ids: string[]) {
  const removed = new Set(ids);
  return selected.filter((id) => !removed.has(id));
}
