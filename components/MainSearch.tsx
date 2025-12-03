/* path: components/MainSearch.tsx */
'use client';

type MainSearchProps = {
  onClick?: () => void;
  placeholder?: string;
};

export default function MainSearch({
  onClick,
  placeholder = 'Поиск по вопросам',
}: MainSearchProps) {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <>
      <div className="feed-search-wrap">
        <button
          type="button"
          className="feed-search-box"
          onClick={handleClick}
        >
          <span className="feed-search-icon">🔍</span>
          <span className="feed-search-placeholder">{placeholder}</span>
          <span className="feed-search-sliders">
            <span />
            <span />
          </span>
        </button>
      </div>

      <style jsx>{`
        .feed-search-wrap {
          margin-top: 12px;
        }

        .feed-search-box {
          width: 100%;
          padding: 12px 14px;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

          display: flex;
          align-items: center;
          gap: 10px;

          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .feed-search-icon {
          font-size: 15px;
          opacity: 0.6;
        }

        .feed-search-placeholder {
          flex: 1;
          text-align: left;
          font-size: 14px;
          color: rgba(15, 23, 42, 0.55);
        }

        .feed-search-sliders {
          display: inline-flex;
          flex-direction: column;
          justify-content: center;
          gap: 3px;
        }

        .feed-search-sliders span {
          width: 14px;
          height: 2px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.5);
        }
      `}</style>
    </>
  );
}
