/* path: components/GlobalSafeTop.tsx */
'use client';

export default function GlobalSafeTop() {
  return (
    <style jsx global>{`
      :root {
        /* ✅ ничего не добавляем сверху, иначе появится воздух и всё съедет */
        --lm-safe-top: 0px;
      }
    `}</style>
  );
}
