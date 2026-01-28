/* path: app/vopros/main/page.tsx */
'use client';

import TopBarBack from '../../../components/TopBarBack';
import QuestionCard, { QuestionCardData } from './QuestionCard';

const MOCK: QuestionCardData[] = [
  {
    id: 'q1',
    title: 'Температура у ребёнка 38.7',
    bodySnippet: 'Вчера прививка, сегодня высокая температура и вялость. Давала Нурофен…',
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
    doctorLabel: 'Педиатр',
    status: 'ANSWERING',
    priceBadge: 'FREE',
  },
  {
    id: 'q2',
    title: 'Боль в груди при вдохе',
    bodySnippet: 'Тянущая боль слева при глубоком вдохе, не могу понять, сердце это или мышца…',
    createdAt: new Date(Date.now() - 7 * 60 * 1000),
    doctorLabel: 'Терапевт',
    status: 'WAITING',
    priceBadge: 'PAID',
  },
];

export default function VoprosMainPage() {
  return (
    <main style={{ padding: 16 }}>
      <TopBarBack />
      <h1 style={{ marginTop: 8, marginBottom: 12 }}>Вопросы</h1>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK.map((q) => (
          <QuestionCard key={q.id} q={q} hrefBase="/vopros" />
        ))}
      </section>
    </main>
  );
}
