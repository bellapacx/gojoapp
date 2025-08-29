import React from 'react';
import { XCircle } from 'react-feather';
import bingoCardsData from '../data/bingoCards.json';

// Helper function to convert card object to 5x5 grid
const getCardGrid = (card) => {
  const grid = [];
  const columns = ['B', 'I', 'N', 'G', 'O'];
  for (let i = 0; i < 5; i++) {
    grid.push([]);
    for (let j = 0; j < 5; j++) {
      grid[i].push(card[columns[j]][i]);
    }
  }
  return grid;
};

export default function SimpleCardsModal({ isOpen, onClose, winningCardIds }) {
  if (!isOpen) return null;

  const actualCards = bingoCardsData.filter(card => winningCardIds.includes(card.card_id));
  const cardCategoryColumns = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="fixed inset-0 flex items-start justify-start z-50 p-4"
    onClick={onClose} // 👈 Clicking outside modal triggers close
    >
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md max-h-[90vh] overflow-y-auto relative text-white"
      onClick={(e) => e.stopPropagation()} // 👈 Prevents modal close on inner click
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <XCircle size={28} />
        </button>

        <h2 className="text-4xl font-extrabold mb-6 text-center drop-shadow-lg text-yellow-300">
          🎉 Cards
          {actualCards.length > 1 ? 's' : ''}!
        </h2>

        {actualCards.length === 0 ? (
          <p className="text-center text-xl text-white/80">No cards to display yet.</p>
        ) : (
          <div className="flex justify-center items-center flex-wrap gap-6">
            {actualCards.map((card) => {
              const cardGrid = getCardGrid(card);

              return (
                <div key={card.card_id} className="flex flex-col items-center">
                  <h3 className="text-2xl font-bold text-blue-300 mb-4">Card ID: {card.card_id}</h3>

                  {/* BINGO header row */}
                  <div className="grid grid-cols-5 gap-1 mb-2 w-full max-w-xs">
                    {cardCategoryColumns.map((col) => (
                      <div
                        key={col}
                        className="bg-yellow-500 text-black font-bold p-2 text-center rounded-t-md"
                      >
                        {col}
                      </div>
                    ))}
                  </div>

                  {/* 5x5 number grid */}
                  <div className="space-y-1 w-full max-w-xs">
                    {cardGrid.map((row, rowIndex) => (
                      <div key={rowIndex} className="grid grid-cols-5 gap-1">
                        {row.map((num, colIndex) => (
                          <div
                            key={`${card.card_id}-r${rowIndex}-c${colIndex}`}
                            className={`p-1 text-center font-semibold rounded-sm border border-white/10 text-sm
                              ${
                                num === null
                                  ? 'bg-gray-700 text-white/80'
                                  : 'bg-white/5 text-white/60'
                              }`}
                          >
                            {num === null ? 'FREE' : num.toString().padStart(2, '0')}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
