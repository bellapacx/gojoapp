'use client';
import React, { useState, useEffect } from 'react';
import { XCircle } from 'react-feather';
import { useAudioManager } from "./audiomanager";

// --- Bingo utilities ---
const getCardGrid = (card) => {
  const grid = [];
  const columns = ['B','I','N','G','O'];
  for (let i = 0; i < 5; i++) {
    grid.push([]);
    for (let j = 0; j < 5; j++) {
      grid[i].push(card[columns[j]][i]);
    }
  }
  return grid;
};

const isMarked = (num, calledNumbersSet) =>
  num === null || calledNumbersSet.has(num);

// All possible 1-line options (rows, cols, diagonals)
const getAllLinesCoords = () => {
  const lines = [];
  for (let r = 0; r < 5; r++) lines.push([...Array(5).keys()].map(c => [r, c])); // rows
  for (let c = 0; c < 5; c++) lines.push([...Array(5).keys()].map(r => [r, c])); // cols
  lines.push([...Array(5).keys()].map(i => [i, i]));        // TL → BR diagonal
  lines.push([...Array(5).keys()].map(i => [i, 4 - i]));    // TR → BL diagonal
  return lines;
};

// Return all completed lines for a card, including corners
const getCompletedLines = (card, calledNumbersSet) => {
  const grid = getCardGrid(card);

  let completedLines = getAllLinesCoords().filter(line =>
    line.every(([r, c]) => isMarked(grid[r][c], calledNumbersSet))
  );

  // Add corners as a line
  const corners = [[0,0],[0,4],[4,0],[4,4]];
  if (corners.every(([r,c]) => isMarked(grid[r][c], calledNumbersSet))) {
    completedLines.push(corners);
  }

  return completedLines;
};

// Other pattern coordinates
const getFullHouseCoords = () => [...Array(5).keys()].flatMap(r => [...Array(5).keys()].map(c => [r,c]));
const getCrossCoords = () => {
  const middle = 2;
  return [...Array(5).keys()].map(i => [middle,i])
         .concat([...Array(5).keys()].filter(i=>i!==middle).map(i => [i,middle]));
};
const getInnerCornersAndCenterCoords = () => [[1,1],[1,3],[3,1],[3,3],[2,2]];

export default function WinningCardsModal({
  isOpen,
  onClose,
  allBingoCards,
  initialManualCardId = '',
  winningPattern,
  calledNumbers = [],
  selectedCards = [],
}) {
  const [manualCardId, setManualCardId] = useState(initialManualCardId?.toString() || '');
  const [winningPatterns, setWinningPatterns] = useState({});
  const [lockedCards, setLockedCards] = useState(new Set());
  const calledNumbersSet = new Set(calledNumbers);
  const { playNoIdGame, playWinGame, playLock,playFailedGame } = useAudioManager();

  useEffect(() => {
    if (isOpen) setManualCardId(initialManualCardId?.toString() || '');
  }, [isOpen, initialManualCardId]);

  // --- Compute which cells should be highlighted green ---
  const updateWinningPattern = (cardId) => {
    const card = allBingoCards.find(c => c.card_id === Number(cardId));
    if (!card) return;

    let coords = [];
    const completedLines = getCompletedLines(card, calledNumbersSet);

    switch (winningPattern) {
      case '1 Line':
        if (completedLines.length > 0) coords = completedLines.flat();
        break;
      case '2 Lines':
        if (completedLines.length >= 1) coords = completedLines.flat();
      case '3 Lines':
        if (completedLines.length >= 1) coords = completedLines.flat();
        break;
      case 'Full House':
        if (getFullHouseCoords().every(([r,c]) => isMarked(card['BINGO'[c]][r], calledNumbersSet)))
          coords = getFullHouseCoords();
        break;
      case 'Cross':
        if (getCrossCoords().every(([r,c]) => isMarked(card['BINGO'[c]][r], calledNumbersSet)))
          coords = getCrossCoords();
        break;
      case 'Inner Corners + Center':
        if (getInnerCornersAndCenterCoords().every(([r,c]) => isMarked(card['BINGO'[c]][r], calledNumbersSet)))
          coords = getInnerCornersAndCenterCoords();
        break;
      case 'Four Corners':
        const corners = [[0,0],[0,4],[4,0],[4,4]];
        if (corners.every(([r,c]) => isMarked(card['BINGO'[c]][r], calledNumbersSet)))
          coords = corners;
        break;
      default:
        break;
    }

    setWinningPatterns({ [cardId]: coords });
  };

  useEffect(() => {
    if (manualCardId) updateWinningPattern(manualCardId);
  }, [manualCardId, winningPattern, allBingoCards, calledNumbers]);

  const isWinningCell = (cardId, rowIdx, colIdx) => {
    const pattern = winningPatterns[cardId];
    return pattern?.some(([r, c]) => r === rowIdx && c === colIdx) || false;
  };

  if (!isOpen) return null;

  const displayedCard = allBingoCards.find(c => c.card_id === Number(manualCardId));
  const cardGrid = displayedCard ? getCardGrid(displayedCard) : [];
  const cardCategoryColumns = ['B','I','N','G','O'];
  const isLocked = manualCardId && lockedCards.has(Number(manualCardId));
  const playwin = () => {
  playWinGame();
};
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-3xl overflow-y-auto relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <XCircle size={28} />
        </button>

        <h2 className="text-3xl font-extrabold mb-6 text-center drop-shadow-lg text-yellow-300">
          🎯Card#{manualCardId || 'Enter Card ID'} {isLocked && '🔒'}
        </h2>

        {/* BINGO Header */}
        <div className="grid grid-cols-5 gap-1 mb-2 w-full max-w-xs mx-auto">
          {cardCategoryColumns.map(col => (
            <div key={col} className="bg-yellow-500 text-black font-bold p-2 text-center rounded-t-md">{col}</div>
          ))}
        </div>

        {/* 5x5 Grid */}
        {displayedCard && (
          <div className={`space-y-1 w-full max-w-xs mx-auto ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            {cardGrid.map((row,rowIndex)=>(
              <div key={rowIndex} className="grid grid-cols-5 gap-1">
                {row.map((num, colIndex) => (
                  <div
                    key={`${displayedCard.card_id}-r${rowIndex}-c${colIndex}`}
                    className={`p-2 text-center font-semibold rounded-sm border border-white/10 text-sm ${
                      num === null
                        ? 'bg-gray-700 text-white/80'
                        : isWinningCell(displayedCard.card_id.toString(), rowIndex, colIndex)
                          ? 'bg-green-600 text-white font-bold animate-pulse'
                          : isMarked(num, calledNumbersSet)
                            ? 'bg-red-600 text-white font-semibold'
                            : 'bg-white/5 text-white/60'
                    }`}
                  >
                    {num === null ? 'FREE' : num.toString().padStart(2,'0')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className='flex justify-center mt-6 gap-2 flex-wrap'>
          <button disabled={isLocked} onClick={()=> {playwin()}} className={`px-4 py-2 rounded text-white font-semibold transition ${isLocked ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            Good Bingo
          </button>
          <button disabled={isLocked} onClick={()=> {playFailedGame()}} className={`px-4 py-2 rounded text-white font-semibold transition ${isLocked ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}>
            Not Bingo
          </button>
          <button disabled={isLocked} onClick={() => { playLock(); if (manualCardId) setLockedCards(prev => new Set(prev).add(Number(manualCardId))); }}
            className={`px-4 py-2 rounded text-white font-semibold transition ${isLocked ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            እሰር
          </button>
        </div>

        {/* Manual ID input */}
        <div className="flex flex-col items-center mt-6 gap-2">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter Card ID"
              value={manualCardId}
              onChange={e => setManualCardId(e.target.value)}
              className="px-2 py-1 rounded text-white bg-black/20 border border-white/30 
                focus:outline-none focus:ring-2 focus:ring-yellow-400 transition 
                w-32 text-center"
            />
            <button
              onClick={() => {
                if (manualCardId) {
                  const id = Number(manualCardId);
                  if (selectedCards.includes(id)) {
                    updateWinningPattern(id);
                  } else {
                    playNoIdGame(); // 🚨 not in selected cards
                  }
                }
              }}
              className="px-4 py-2 rounded font-semibold transition bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
