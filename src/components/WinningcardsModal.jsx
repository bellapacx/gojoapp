import React, { useState, useEffect } from 'react';
import { XCircle } from 'react-feather';

// BINGO categories
const CATEGORIES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

const getCategory = (num) => {
  for (const [key, [min, max]] of Object.entries(CATEGORIES)) {
    if (num >= min && num <= max) return key;
  }
  return '';
};

const categoryColors = {
  B: 'bg-blue-800 text-blue-200 border-blue-700',
  I: 'bg-indigo-800 text-indigo-200 border-indigo-700',
  N: 'bg-purple-800 text-purple-200 border-purple-700',
  G: 'bg-green-800 text-green-200 border-green-700',
  O: 'bg-orange-800 text-orange-200 border-orange-700',
};

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

const isMarked = (num, calledNumbersSet) => {
  return num === null || calledNumbersSet.has(num);
};

export default function WinningCardsModal({
  isOpen,
  onClose,
  winningCardIds,
  allBingoCards,
  calledNumbersSet,
  status = 'won',
  failedCards,
   winningPatterns = {},
}) {
  const [checkedFailedCards, setCheckedFailedCards] = useState([]);
   
  const isWinningCell = (cardId, rowIdx, colIdx) => {
  const pattern = winningPatterns[cardId];
  if (!pattern) return false;
  return pattern.some(([r, c]) => r === rowIdx && c === colIdx);
};

  // Play audio once when modal opens with winners
  useEffect(() => {
    if (isOpen && winningCardIds.length > 0 && status === 'won') {
      const audio = new Audio("/game/win.m4a");

      // Create AudioContext and GainNode for volume boost
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 3.0;

      const source = audioContext.createMediaElementSource(audio);
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      audio.play().catch((err) => {
        console.warn("Audio play blocked by browser:", err);
      });
    }
  }, [isOpen, winningCardIds, status]);

  if (!isOpen) return null;

  // ✅ Use correct cards based on status
  const displayedCards =
    status === 'failed'
      ? allBingoCards.filter((card) => failedCards.includes(card.card_id))
      : allBingoCards.filter((card) => winningCardIds.includes(card.card_id));

  const isCardChecked = (cardId) => checkedFailedCards.includes(cardId);

  const handleMarkAsChecked = (cardId) => {
    if (!isCardChecked(cardId)) {
      setCheckedFailedCards((prev) => [...prev, cardId]);
    }
    playCheckSound();
  };
// Function to play check sound from public folder
const playCheckSound = () => {
  try {
    // Play sound from public folder
    const audio = new Audio('/game/failed.m4a'); // Adjust path if needed
    audio.volume = 0.5; // Adjust volume as needed (0.0 to 1.0)
    audio.play().catch(e => console.log("Audio play failed:", e));
    
  } catch (error) {
    console.log("Sound playback error:", error);
  }
};
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <XCircle size={28} />
        </button>

        <h2
          className={`text-4xl font-extrabold mb-6 text-center drop-shadow-lg ${
            status === 'won' ? 'text-yellow-300' : 'text-red-400'
          }`}
        >
          {status === 'won'
            ? `🎉 ${displayedCards.length} Winning Card${displayedCards.length > 1 ? 's' : ''}!`
            : `❌ ${displayedCards.length} Failed Card${displayedCards.length > 1 ? 's' : ''}!`}
        </h2>

        {displayedCards.length === 0 ? (
          <p className="text-center text-xl text-white/80">No cards to display yet.</p>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-2 flex justify-center">
            <div
              className={`${
                displayedCards.length === 1
                  ? "w-full max-w-md"
                  : "grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              }`}
            >
              {displayedCards.map((card, idx) => {
                const cardGrid = getCardGrid(card);
                const cardCategoryColumns = ['B', 'I', 'N', 'G', 'O'];
                const alreadyChecked = status === 'failed' && isCardChecked(card.card_id);

                return (
                  <div
                    key={card.card_id}
                    className={`flex flex-col items-center border border-white/10 rounded-lg p-4 bg-black/10 ${
                      displayedCards.length === 1 ? "mx-auto" : ""
                    }`}
                  >
                    <span className="text-sm text-white/40 mb-1">
                      {status === 'failed' ? `Card#${idx + 1}` : `Winner#${idx + 1}`}
                    </span>
                    <h3 className="text-2xl font-bold text-blue-300 mb-4">
                      Card ID: {card.card_id}
                    </h3>

                    {status === 'failed' && !alreadyChecked && (
                      <button
                        onClick={() => handleMarkAsChecked(card.card_id)}
                        className="mb-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold transition"
                      >
                        እሰር
                      </button>
                      
                    )}
                     {status === 'failed' && !alreadyChecked && (
                      <button
                        onClick={() => handleMarkAsChecked(card.card_id)}
                        className="mb-4 px-4 py-2 bg-green-600 hover:bg-red-700 rounded text-white font-semibold transition"
                      >
                        Good Bingo
                      </button>
                      
                    )}

                    {status === 'failed' && alreadyChecked && (
                      <p className="text-red-400 font-semibold mb-4">This card is already checked.</p>
                    )}

                    {/* BINGO Header */}
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

                    {/* 5x5 Grid */}
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
        : isWinningCell(card.card_id, rowIndex, colIndex)
        ? 'bg-green-600 text-white font-bold animate-pulse'
        : isMarked(num, calledNumbersSet)
        ? 'bg-red-600 text-white'
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
          </div>
        )}
      </div>
    </div>
  );
}
