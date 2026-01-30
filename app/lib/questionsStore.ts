/* path: app/lib/questionsStore.ts */
'use client';

import { useSyncExternalStore } from 'react';

export type FeedQuestionItem = {
  id: string;
  title: string;
  bodySnippet: string;
  createdAt: string; // ISO
  doctorLabel: string;

  // ✅ новое: "Вопрос от ..."
  authorLabel?: string;

  status: 'ANSWERING' | 'WAITING';
  priceBadge: 'FREE' | 'PAID';
  optimistic?: boolean; // локально созданный, пока не подтвердили/не подтянули с сервера
};

type State = {
  items: FeedQuestionItem[];
};

const listeners = new Set<() => void>();

let state: State = {
  items: [],
};

function emit() {
  for (const l of listeners) l();
}

function toTs(iso: string) {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

function sortDesc(a: FeedQuestionItem, b: FeedQuestionItem) {
  return toTs(b.createdAt) - toTs(a.createdAt);
}

export function feedGetItems(): FeedQuestionItem[] {
  return state.items;
}

export function feedSubscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function feedSetItems(next: FeedQuestionItem[]) {
  state = {
    items: Array.isArray(next) ? [...next].sort(sortDesc) : [],
  };
  emit();
}

export function feedUpsertTop(item: FeedQuestionItem) {
  const id = String(item.id);
  const prev = state.items;
  const idx = prev.findIndex((x) => String(x.id) === id);

  let next: FeedQuestionItem[];
  if (idx >= 0) {
    // merge и снимаем optimistic если пришло нормальное
    const merged: FeedQuestionItem = {
      ...prev[idx],
      ...item,
      optimistic: item.optimistic ?? prev[idx].optimistic,
    };
    next = [merged, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
  } else {
    next = [item, ...prev];
  }

  state = { items: next.sort(sortDesc) };
  emit();
}

export function feedMergeServerItems(serverItems: FeedQuestionItem[]) {
  const map = new Map<string, FeedQuestionItem>();

  // сначала текущие (включая optimistic)
  for (const it of state.items) map.set(String(it.id), it);

  // затем сервер — он “главнее”
  for (const it of serverItems) {
    const id = String(it.id);
    const prev = map.get(id);

    map.set(id, {
      ...(prev || {}),
      ...it,
      optimistic: false,
    });
  }

  const merged = Array.from(map.values()).sort(sortDesc);
  state = { items: merged };
  emit();
}

export function useFeedItems() {
  return useSyncExternalStore(feedSubscribe, feedGetItems, feedGetItems);
}
