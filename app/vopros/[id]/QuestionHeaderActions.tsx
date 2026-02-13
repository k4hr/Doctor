/* path: app/vopros/[id]/QuestionHeaderActions.tsx */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function haptic(type: 'light' | 'medium' = 'light') {
  try {
    (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function tgAlert(msg: string) {
  try {
    (window as any)?.Telegram?.WebApp?.showAlert?.(msg);
    return;
  } catch {}
  alert(msg);
}

function openTelegramShare(url: string, text: string) {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  try {
    (window as any)?.Telegram?.WebApp?.openTelegramLink?.(share);
    return;
  } catch {}
  window.open(share, '_blank', 'noopener,noreferrer');
}

type Props = {
  questionId: string;
  isAuthor: boolean;
};

export default function QuestionHeaderActions({ questionId, isAuthor }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [canEdit, setCanEdit] = useState(false);
  const [editLoaded, setEditLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!isAuthor) {
        setEditLoaded(true);
        setCanEdit(false);
        return;
      }

      try {
        const res = await fetch(`/api/question/edit-info?id=${encodeURIComponent(questionId)}`, {
          method: 'GET',
          cache: 'no-store',
        });
        const j = await res.json().catch(() => ({} as any));
        if (!alive) return;

        setCanEdit(!!j?.ok && !!j?.canEdit);
        setEditLoaded(true);
      } catch {
        if (!alive) return;
        setCanEdit(false);
        setEditLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthor, questionId]);

  const actionLabel = useMemo(() => {
    if (isAuthor) return canEdit ? 'Редактировать' : 'Редактирование недоступно';
    return 'Жалоба';
  }, [isAuthor, canEdit]);

  const onToggle = () => {
    haptic('light');
    setOpen((v) => !v);
  };

  const onCloseQuestion = () => {
    haptic('medium');

    if (!isAuthor) {
      tgAlert('Закрыть вопрос может только автор.');
      return;
    }

    router.push(`/vopros/${encodeURIComponent(questionId)}/close`);
  };

  const onAction = () => {
    haptic('light');
    setOpen(false);

    if (isAuthor) {
      if (!canEdit) {
        tgAlert('Редактирование недоступно (уже использовано/есть ответы/вопрос закрыт).');
        return;
      }
      router.push(`/vopros/${encodeURIComponent(questionId)}/edit`);
      return;
    }

    const href = typeof window !== 'undefined' ? window.location.href : '';
    openTelegramShare(href, `Жалоба на вопрос #${questionId}`);
  };

  return (
    <div className="qh">
      <button type="button" className="qhClose" onClick={onCloseQuestion} aria-label="Закрыть вопрос">
        Закрыть вопрос
      </button>

      <div className="qhRight">
        <button type="button" className="qhMini" onClick={onToggle} aria-label={actionLabel} title={actionLabel}>
          ⋯
        </button>

        {open ? (
          <>
            <button type="button" className="qhOverlay" onClick={() => setOpen(false)} aria-label="Закрыть меню" />
            <div className="qhMenu" role="menu" aria-label="Действия">
              <button
                type="button"
                className={'qhMenuItem ' + (isAuthor && editLoaded && !canEdit ? 'qhMenuItem--disabled' : '')}
                onClick={onAction}
                role="menuitem"
                disabled={isAuthor && editLoaded && !canEdit}
              >
                {actionLabel}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <style jsx>{`
        .qh {
          margin-top: 8px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .qhClose {
          border: 1px solid rgba(36, 199, 104, 0.45);
          background: rgba(255, 255, 255, 0.96);
          color: #059669;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 18px rgba(22, 163, 74, 0.12);
          white-space: nowrap;
        }

        .qhClose:active {
          transform: scale(0.99);
          opacity: 0.92;
        }

        .qhRight {
          position: relative;
          flex: 0 0 auto;
        }

        .qhMini {
          width: 42px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.96);
          color: rgba(15, 23, 42, 0.85);
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
          display: grid;
          place-items: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        }

        .qhMini:active {
          transform: scale(0.98);
          opacity: 0.92;
        }

        .qhOverlay {
          position: fixed;
          inset: 0;
          background: transparent;
          border: 0;
          z-index: 999;
        }

        .qhMenu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          z-index: 1000;
          min-width: 200px;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 18px 40px rgba(18, 28, 45, 0.16);
          overflow: hidden;
        }

        .qhMenuItem {
          width: 100%;
          text-align: left;
          padding: 12px 12px;
          border: 0;
          background: transparent;
          font-size: 13px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.86);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .qhMenuItem:active {
          background: rgba(15, 23, 42, 0.05);
        }

        .qhMenuItem--disabled {
          color: rgba(15, 23, 42, 0.35);
          cursor: default;
        }
      `}</style>
    </div>
  );
}
