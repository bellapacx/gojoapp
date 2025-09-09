import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Maximize2 } from 'react-feather';
import WinningCardsModal from './WinningcardsModal';
import { submitWinning } from '../service/api'; // Adjust the import path as necessary
import bingoCards from '../data/bingoCards.json'; // Ensure this path is correct
import { useAudioManager } from "./audiomanager";
const NUMBER_RANGE = Array.from({ length: 75 }, (_, i) => i + 1);
const CATEGORIES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};
// Define all patterns
const patterns = {
  line: [
    [0, 1, 2, 3, 4],        // Row 0
  ],
  twoLines: [
    [0, 1, 2, 3, 4, 10, 11, 12, 13, 14],   // Row 0 + Row 1
  ],
  threeLines: [
    [0, 1, 2, 3, 4, 10, 11, 12, 13, 14, 20, 21, 22, 23,24], // Row 0 + Row 1 + Row 2
  ],
  diagonal: [
    [0, 6, 12, 18, 24],      // TL → BR
  ],
  fullhouse: [
    Array.from({ length: 25 }, (_, i) => i),
  ],
};

const getCategory = (num) => {
  for (const [key, [min, max]] of Object.entries(CATEGORIES)) {
    if (num >= min && num <= max) return key;
  }
  return '';
};

// Enhanced category colors with gradients and glows for a more beautiful grid
const categoryColors = {
  B: 'bg-gradient-to-br from-blue-500 via-blue-700 to-blue-900 text-blue-50 border-blue-400 shadow-blue-300/30',
  I: 'bg-gradient-to-br from-pink-400 via-pink-600 to-pink-800 text-pink-50 border-pink-400 shadow-pink-300/30',
  N: 'bg-gradient-to-br from-purple-500 via-purple-700 to-purple-900 text-purple-50 border-purple-400 shadow-purple-300/30',
  G: 'bg-gradient-to-br from-green-500 via-green-700 to-green-900 text-green-50 border-green-400 shadow-green-300/30',
  O: 'bg-gradient-to-br from-amber-400 via-orange-600 to-orange-900 text-amber-50 border-amber-400 shadow-orange-300/30',
};


export default function DashboardScreen({
  roundId,
  shopId,
  prize,
  selectedCards,
  interval,
  language, // This prop now controls voice language
  betPerCard,
  commissionRate,
  winningPattern,
  setCurrentView,
}) {
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentCall, setCurrentCall] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [winningCards, setWinningCards] = useState([]);
   const [failedCards, setFailedCards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualCardId, setManualCardId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [mode, setMode] = useState('manual');
  const [status, setStatus] = useState("won");
const [lastWinCheckNumberCount, setLastWinCheckNumberCount] = useState(0);
const [passedCards, setPassedCards] = useState(new Set());
const [lockedCards, setLockedCards] = useState([]);
const intervalRef = useRef(null); 
const [winningPatterns, setWinningPatterns] = useState('');
const [restartedCards, setRestartedCards] = useState([]);
const [bingoPattern, setBingoPattern] = useState(Array(25).fill(false));
const [patternType, setPatternType] = useState("line"); 
 const [showBalls, setShowBalls] = useState(false);
  const [balls, setBalls] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [roundwon, setRoundWon] = useState(false);
const [round, setRound] = useState(1); // start at round 1
 const { playBingoCall, playShuffle, playStartGame, playPauseGame, playNoIdGame } = useAudioManager();
  // State and ref for speech synthesis
  const speechUtteranceRef = useRef(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const audioCache = useRef(new Map());
  const audioContextRef = useRef(null);
  const audioCacheRef = useRef(new Map()); // cache all audio elements
  const audioSourceRef = useRef(new Map()); // keep MediaElementSourceNode references
const gainNodeRef = useRef(null);
const audioRef = useRef(null);
 const gameAudioRef = useRef(null);
const [bingoCardsData, setBingoCards] = useState([]);



  // Generic function to play any cached sound
 

useEffect(() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioContextRef.current = new AudioContextClass();

  gainNodeRef.current = audioContextRef.current.createGain();
  gainNodeRef.current.gain.value = 3.0; // 3x louder
  gainNodeRef.current.connect(audioContextRef.current.destination);
}, []);




   useEffect(() => {
  const shopId = localStorage.getItem("shopid");
  if (!shopId) {
    setBingoCards(bingoCardsData); // local default
    return;
  }

  fetch(`/data/${shopId}.json`)
    .then(res => {
      if (!res.ok) throw new Error("Not found");
      return res.json();
    })
    .then(data => setBingoCards(data))
    .catch(() => setBingoCards(bingoCards)); // fallback to default
}, []);


 const playSoundForCall = (category, number) => {
  // Stop previous call handled automatically inside AudioManager
  playBingoCall(category.toLowerCase(), number);
};

const playSoundForCalls = (category, number) => {
  const audioPath = `/voicemale/${category.toLowerCase()}_${number}.m4a`;

  // Stop previous audio if playing
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  // Get preloaded audio from cache
  let audioEl = audioCache.current.get(audioPath);
  if (!audioEl) {
    // Safety fallback: create & connect only once if not cached
    audioEl = new Audio(audioPath);
    audioCache.current.set(audioPath, audioEl);

    if (audioContextRef.current && gainNodeRef.current) {
      const source = audioContextRef.current.createMediaElementSource(audioEl);
      source.connect(gainNodeRef.current);
    }
  }

  // Track as currently playing audio
  audioRef.current = audioEl;

  // Play from start
  audioEl.currentTime = 0;
  audioEl.play().catch((err) => {
    console.warn("🎧 Audio play error:", err);
  });
};

const togglePlayPause = () => {
  // Dummy speech activation if needed
  if (!isRunning && currentCall === null && speechUtteranceRef.current) {
    const dummyUtterance = new SpeechSynthesisUtterance(' ');
    window.speechSynthesis.speak(dummyUtterance);
  }

  // Play appropriate sound via AudioManager
  if (isRunning) {
    playPauseGame();  // plays pause sound
  } else {
    playStartGame();  // plays start sound
  }

  // Toggle running state
  setIsRunning(prev => !prev);
};
const togglePlayPauses = () => {
    // Dummy speech activation (if needed)
    if (!isRunning && currentCall === null && speechUtteranceRef.current) {
        const dummyUtterance = new SpeechSynthesisUtterance(' ');
        window.speechSynthesis.speak(dummyUtterance);
    }

    // Play sound with Web Audio API for volume boost
    const audio = new Audio(!isRunning ? "/game/start_game.m4a" : "/game/pause_game.m4a");
    
    // Create AudioContext and GainNode
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 3.0; // 200% louder (1.0 = normal, 3.0 = 300% volume)

    // Connect audio to gain node and output
    const source = audioContext.createMediaElementSource(audio);
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    audio.play().catch((err) => {
        console.warn("Audio play blocked by browser:", err);
    });
  
    setIsRunning((prev) => !prev);
};
// Cleanup on component unmount

  // --- Speech Synthesis Setup ---
  
  // Effect to speak the current number when it changes
  useEffect(() => {
  if (currentCall !== null) {
    const category = getCategory(currentCall);

    if (language === 'Amharic') {
      playSoundForCall(category, currentCall);
    } else if (speechUtteranceRef.current && availableVoices.length > 0) {
      window.speechSynthesis.cancel();

      const textToSpeak = `${category}. ${currentCall}.`;
      speechUtteranceRef.current.text = textToSpeak;

      const voiceLangPrefix = language === 'ti' ? 'ti' : 'en';
      const selectedVoice = availableVoices.find(
        (voice) =>
          voice.lang.startsWith(voiceLangPrefix) &&
          (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.default)
      );

      if (selectedVoice) {
        speechUtteranceRef.current.voice = selectedVoice;
        speechUtteranceRef.current.lang = selectedVoice.lang;
      } else {
        speechUtteranceRef.current.lang = 'en-US';
      }

      try {
        window.speechSynthesis.speak(speechUtteranceRef.current);
      } catch (e) {
        console.error('Speech synthesis failed:', e);
      }
    }
  }
}, [currentCall, language, availableVoices]);
// Dependencies for this effect

 // Auto-cycle pattern type every X seconds
  useEffect(() => {
    const cycleOrder = ["line","twoLines", "threeLines", "diagonal", "fullhouse"];
    let typeIndex = 0;

    const cycleInterval = setInterval(() => {
      setPatternType(cycleOrder[typeIndex]);
      typeIndex = (typeIndex + 1) % cycleOrder.length;
    }, 6000); // 6 seconds per pattern

    return () => clearInterval(cycleInterval);
  }, []);

useEffect(() => {
  // Reset the board
  setBingoPattern(Array(25).fill(false));

  const typePatterns = patterns[patternType];
  const activePattern =
    typePatterns[Math.floor(Math.random() * typePatterns.length)];

  // Fill all cells in the pattern immediately
  setBingoPattern((prev) => {
    const updated = [...prev];
    activePattern.forEach((i) => {
      updated[i] = true;
    });
    return updated;
  });
}, [patternType]);





  // Helper function to convert card object to a 5x5 grid array (handling null for free space)
  const getCardGrid = (card) => {
    const grid = [];
    const columns = ['B', 'I', 'N', 'G', 'O'];
    for (let i = 0; i < 5; i++) {https://gojoapp.vercel.app/
      grid.push([]);
      for (let j = 0; j < 5; j++) {
        grid[i].push(card[columns[j]][i]);
      };
    }
    return grid;
  };

  // Helper to check if a number on a card is considered "marked" (called or free space)
  const isMarked = (num, calledNumbersSet) => {
    return num === null || calledNumbersSet.has(num);
  };

  // Check for lines (rows, columns, diagonals) completed on a card
  const checkLinesOnCard = (grid, calledNumbersSet) => {
    let linesWon = 0;

    // Check Rows
    for (let i = 0; i < 5; i++) {
      if (grid[i].every(num => isMarked(num, calledNumbersSet))) {
        linesWon++;
      }
    }

    // Check Columns
    for (let j = 0; j < 5; j++) {
      let colComplete = true;
      for (let i = 0; i < 5; i++) {
        if (!isMarked(grid[i][j], calledNumbersSet)) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) {
        linesWon++;
      }
    }

    // Check Diagonals
    let diag1Complete = true; // Top-left to bottom-right
    for (let i = 0; i < 5; i++) {
      if (!isMarked(grid[i][i], calledNumbersSet)) {
        diag1Complete = false;
        break;
      }
    }
    if (diag1Complete) {
      linesWon++;
    }

    let diag2Complete = true; // Top-right to bottom-left
    for (let i = 0; i < 5; i++) {
      if (!isMarked(grid[i][4 - i], calledNumbersSet)) {
        diag2Complete = false;
        break;
      }
    }
    if (diag2Complete) {
      linesWon++;
    }

    return linesWon;
  };

  // Check for Full House win
  const checkFullHouseWin = (grid, calledNumbersSet) => {
    return grid.flat().every(num => isMarked(num, calledNumbersSet));
  };
// Check for Four Corners win
const checkFourCornersWin = (grid, calledNumbersSet) => {
  const corners = [
    grid[0][0], // top-left
    grid[0][4], // top-right
    grid[4][0], // bottom-left
    grid[4][4]  // bottom-right
  ];

  return corners.every(num => isMarked(num, calledNumbersSet));
};
//check for Cross Pattern win
const checkCrossPatternWin = (grid, calledNumbersSet) => {
  const middle = 2; // center index for 5x5 grid

  // Get middle row and column values (center cell is shared, avoid duplicate)
  const crossNumbers = new Set();

  // Add middle row
  for (let col = 0; col < 5; col++) {
    crossNumbers.add(grid[middle][col]);
  }

  // Add middle column
  for (let row = 0; row < 5; row++) {
    if (row !== middle) {
      crossNumbers.add(grid[row][middle]);
    }
  }

  // Check if all cross numbers are marked
  return [...crossNumbers].every(num => isMarked(num, calledNumbersSet));
};
// check inner corner
const checkInnerCornersAndCenterWin = (grid, calledNumbersSet) => {
  const positions = [
    grid[1][1], // top-left inner
    grid[1][3], // top-right inner
    grid[3][1], // bottom-left inner
    grid[3][3], // bottom-right inner
    grid[2][2], // center (usually FREE)
  ];

  return positions.every(num => isMarked(num, calledNumbersSet));
};
const getWinningLineCoords = (grid, calledNumbersSet) => {
  const coords = [];

  // Rows
  for (let i = 0; i < 5; i++) {
    if (grid[i].every(num => isMarked(num, calledNumbersSet))) {
      for (let j = 0; j < 5; j++) coords.push([i, j]);
    }
  }

  // Columns
  for (let j = 0; j < 5; j++) {
    let colComplete = true;
    for (let i = 0; i < 5; i++) {
      if (!isMarked(grid[i][j], calledNumbersSet)) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) {
      for (let i = 0; i < 5; i++) coords.push([i, j]);
    }
  }

  // Diagonals
  let diag1 = true;
  for (let i = 0; i < 5; i++) {
    if (!isMarked(grid[i][i], calledNumbersSet)) {
      diag1 = false;
      break;
    }
  }
  if (diag1) {
    for (let i = 0; i < 5; i++) coords.push([i, i]);
  }

  let diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!isMarked(grid[i][4 - i], calledNumbersSet)) {
      diag2 = false;
      break;
    }
  }
  if (diag2) {
    for (let i = 0; i < 5; i++) coords.push([i, 4 - i]);
  }

  return coords;
};

const getFullHouseCoords = () => {
  const coords = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      coords.push([i, j]);
    }
  }
  return coords;
};

const getFourCornersCoords = () => [
  [0, 0],
  [0, 4],
  [4, 0],
  [4, 4],
];

const getCrossCoords = () => {
  const coords = [];
  const middle = 2;
  for (let i = 0; i < 5; i++) coords.push([middle, i]); // middle row
  for (let i = 0; i < 5; i++) {
    if (i !== middle) coords.push([i, middle]); // middle column (excluding center)
  }
  return coords;
};
const getInnerCornersAndCenterCoords = () => [
  [1, 1],
  [1, 3],
  [3, 1],
  [3, 3],
  [2, 2],
];

const gameOverRef = useRef(false);
 // Main win checking function

//manual check function
const handleManualChecks = async () => {
  if (!manualCardId) {
    alert("Please enter a Card ID.");
    return;
  }

  if (!calledNumbers.length) {
    alert("No called numbers yet. Cannot check.");
    return;
  }
  setIsLoading(true);
  const normalizedManualId = Number(manualCardId.trim());

  if (lockedCards.includes(normalizedManualId)) {
    alert(`Card ${normalizedManualId} has already passed. It cannot win anymore.`);
    return;
  }

  const selectedCardsData = bingoCardsData.filter(card =>
    selectedCards.includes(card.card_id)
  );
  const card = selectedCardsData.find(c => c.card_id === normalizedManualId);

  if (!card) {
    alert("Card ID not found in selected cards.");
    return;
  }
  setWinningPatterns(winningPattern);
  const currentCalledNumbersSet = new Set(calledNumbers);
  const cardGrid = getCardGrid(card);
  let isWinner = false;
  let winningCoords = [];

  switch (winningPattern) {
    case '1 Line': {
      const coords = getWinningLineCoords(cardGrid, currentCalledNumbersSet);
      if (coords.length >= 5) {
        isWinner = true;
        winningCoords = coords;
      }
      break;
    }
    case '2 Lines': {
      const coords = getWinningLineCoords(cardGrid, currentCalledNumbersSet);
      if (coords.length >= 10) {
        isWinner = true;
        winningCoords = coords;
      }
      break;
    }
    case 'Full House': {
      if (checkFullHouseWin(cardGrid, currentCalledNumbersSet)) {
        isWinner = true;
        winningCoords = getFullHouseCoords();
      }
      break;
    }
    case 'Four Corners': {
      if (checkFourCornersWin(cardGrid, currentCalledNumbersSet)) {
        isWinner = true;
        winningCoords = getFourCornersCoords();
      }
      break;
    }
    case 'Cross': {
      if (checkCrossPatternWin(cardGrid, currentCalledNumbersSet)) {
        isWinner = true;
        winningCoords = getCrossCoords();
      }
      break;
    }
    case 'Inner Corners + Center': {
      if (checkInnerCornersAndCenterWin(cardGrid, currentCalledNumbersSet)) {
        isWinner = true;
        winningCoords = getInnerCornersAndCenterCoords();
      }
      break;
    }
    case 'All': {
      const allCoords = [];

      const lineCoords = getWinningLineCoords(cardGrid, currentCalledNumbersSet);
      if (lineCoords.length >= 5) {
        allCoords.push(...lineCoords);
        isWinner = true;
      }

      if (checkFullHouseWin(cardGrid, currentCalledNumbersSet)) {
        allCoords.push(...getFullHouseCoords());
        isWinner = true;
      }

      if (checkFourCornersWin(cardGrid, currentCalledNumbersSet)) {
        allCoords.push(...getFourCornersCoords());
        isWinner = true;
      }

      if (checkCrossPatternWin(cardGrid, currentCalledNumbersSet)) {
        allCoords.push(...getCrossCoords());
        isWinner = true;
      }

      // Uncomment this if you want to include it in "All"
      // if (checkInnerCornersAndCenterWin(cardGrid, currentCalledNumbersSet)) {
      //   allCoords.push(...getInnerCornersAndCenterCoords());
      //   isWinner = true;
      // }

      winningCoords = allCoords;
      break;
    }

    default:
      console.warn(`Unknown winning pattern: ${winningPattern}`);
      break;
  }

  if (isWinner) {
    console.log(`Manual winner found: Card ID ${manualCardId}`);
    try {
      
      // Submit winning to backend
      try {
      const shopId = localStorage.getItem('shopid');
      const res = await fetch("https://gojbingoapi.onrender.com/startgame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          bet_per_card: betPerCard,   
          prize: prize,
          total_cards: selectedCards.length,
          selected_cards: selectedCards,
        }),
      });
      setRoundWon(true);

      if (!res.ok) throw new Error("post failed");
   
    } catch (err) {
      console.error("Error:", err);
      alert("post failed");
    } finally {
      setIsLoading(false);
    }
      setStatus("won");
      setIsRunning(false);
      setWinningCards([normalizedManualId]);
      setWinningPatterns({ [normalizedManualId]: winningCoords }); // 🎯 Save winning pattern coords
      setIsModalOpen(true);
      window.speechSynthesis.cancel();
    } catch (error) {
      console.error('Error submitting manual winning:', error);
      alert('Failed to submit manual winning.');
    }
  } else {
    setIsLoading(false);
    setStatus("failed");
    setFailedCards([normalizedManualId]);
    setIsModalOpen(true);
  }
};

const handleManualCheck = async () => {
  if (!manualCardId) {
    alert("Please enter a Card ID.");
    return;
  }

  const cardIdNumber = Number(manualCardId);
  setSelectedCardId(cardIdNumber);

  if (!calledNumbers.length) {
    alert("No called numbers yet. Cannot check.");
    return;
  }

  const selectedCardsData = bingoCardsData.filter(card =>
    selectedCards.includes(card.card_id)
  );
  const card = selectedCardsData.find(c => c.card_id === cardIdNumber);
  const playnoidSound = () => {
  playNoIdGame();
};
  if (!card) {
    playNoIdGame();
    setIsLoading(false);
    return;
  }

  // Check if this card has already been passed
  if (passedCards.has(cardIdNumber)) {
   
    setIsModalOpen(true); // open modal without posting
    return;
  }

  // If passedCards already has cards, skip posting but still open modal
  const shouldPost = passedCards.size === 0;

  setIsLoading(true);
  try {
    if (shouldPost) {
      const shopId = localStorage.getItem('shopid');

      const res = await fetch("https://gojbingoapi.onrender.com/startgame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          bet_per_card: betPerCard,
          prize: prize,
          total_cards: selectedCards.length,
          selected_cards: selectedCards,
        }),
      });

      if (!res.ok) throw new Error("post failed");

      setRoundWon(true);

      // mark this card as passed
      setPassedCards(prev => new Set(prev).add(cardIdNumber));
    }

  } catch (err) {
    console.error("Error:", err);
    alert("post failed");
  } finally {
    setIsLoading(false);
    setIsModalOpen(true); // always open modal
  }
};



// Update callNextNumber to check gameOverRef
const callNextNumber = () => {
  if (gameOverRef.current || winningCards.length > 0) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return;
  }

  const remaining = NUMBER_RANGE.filter(n => !calledNumbers.includes(n));
  if (remaining.length === 0) {
    gameOverRef.current = true;
    setIsRunning(false);
    return;
  }

  const next = remaining[Math.floor(Math.random() * remaining.length)];
  const updatedCalledNumbers = [next, ...calledNumbers];
  setCalledNumbers(updatedCalledNumbers);
   setCurrentCall(next);

  // 🛑 Only check for winners if mode is not manual
  if (mode !== 'manual') {
    const currentCalledNumbersSet = new Set(updatedCalledNumbers);
    const cardsToCheck = bingoCardsData.filter(card =>
      selectedCards.includes(card.card_id)
    );

    let winners = [];
    for (const card of cardsToCheck) {
      const grid = getCardGrid(card);
      let isWinner = false;

      switch (winningPattern) {
        case '1 Line':
          isWinner = checkLinesOnCard(grid, currentCalledNumbersSet) >= 1;
          break;
        case '2 Lines':
          isWinner = checkLinesOnCard(grid, currentCalledNumbersSet) >= 2;
          break;
        case 'Full House':
          isWinner = checkFullHouseWin(grid, currentCalledNumbersSet);
          break;
        case 'Four Corners':
          isWinner = checkFourCornersWin(grid, currentCalledNumbersSet);
          break;
        case 'Cross':
          isWinner = checkCrossPatternWin(grid, currentCalledNumbersSet);
          break;
        case 'Inner Corners + Center':
          isWinner = checkInnerCornersAndCenterWin(grid, currentCalledNumbersSet);
          break;
        case 'All':
          isWinner =
            checkLinesOnCard(grid, currentCalledNumbersSet) >= 1 ||
            checkLinesOnCard(grid, currentCalledNumbersSet) >= 2 ||
            checkFullHouseWin(grid, currentCalledNumbersSet) ||
            checkFourCornersWin(grid, currentCalledNumbersSet) ||
            checkCrossPatternWin(grid, currentCalledNumbersSet);
          break;
      }

      if (isWinner && !winningCards.includes(card.card_id)) {
        winners.push(card.card_id);
      }
    }

    if (winners.length > 0) {
      gameOverRef.current = true;
      setWinningCards(winners);
      setIsRunning(false);
      window.speechSynthesis.cancel();
      setTimeout(() => {
        setIsModalOpen(true);
      }, 1000);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      winners.forEach(async (cardId) => {
        try {
          await submitWinning({ cardId, shopId, prize });
        } catch (e) {
          console.error("Failed to submit winner:", cardId, e);
        }
      });
    }
  }
};


  

  useEffect(() => {
  // Clear any existing interval
  // Clear any existing interval
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  console.log("Setting up interval with isRunning:", isRunning, "and winningCards:", winningCards.length);
  // Set new interval only if running and no winners
  if (isRunning && !gameOverRef.current) {
    intervalRef.current = setInterval(() => callNextNumber(), interval);
  }

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [isRunning, calledNumbers, interval, winningCards]);



  const restartGames = () => {
    setIsRunning(false);
    setCalledNumbers([]);
    setCurrentCall(null);
    setWinningCards([]);
    setIsModalOpen(false);
     // 🔥 Pass selectedCards via props to CardManagementScreen
  setCurrentView({
    name: 'card_management',
    props: {
      selectedCards,
    },
  });
    
    window.speechSynthesis.cancel(); // Stop any speech on restart
  };
const restartGame = () => {
  setIsRunning(false);
  setCalledNumbers([]);
  setCurrentCall(null);
  setWinningCards([]);
  setIsModalOpen(false);

  const today = new Date().toISOString().split('T')[0];
  const storedRounds = JSON.parse(localStorage.getItem('dailyRounds') || '{}');
  let todayRound = storedRounds[today] || 1; // start from 1 if not exists

  if (roundwon) {
    // Increment and persist today's round
    todayRound += 1;
    storedRounds[today] = todayRound;
    localStorage.setItem('dailyRounds', JSON.stringify(storedRounds));

    setRound(todayRound); // update local state
    setCurrentView({
      name: 'card_management',
      props: { round: todayRound, patterns: winningPattern },
    });
  } else {
    // Do not increment round, just pass selectedCards
    setCurrentView({
      name: 'card_management',
      props: { selectedCards, patterns: winningPattern },
    });
  }
};




  const requestFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  };

const playShuffleSound = () => {
  playShuffle();
};
 const generateRandomBalls = () => {
    playShuffleSound();
    const newBalls = [];
    while (newBalls.length < 10) {
      const num = Math.floor(Math.random() * 75) + 1;
      if (!newBalls.some(b => b.number === num)) {
        newBalls.push({
          number: num,
          left: Math.random() * 80 + 10, // 10-90% positioning
          top: Math.random() * 80 + 10,
          rotation: Math.random() * 60 - 30, // -30 to 30 degrees
          delay: Math.random() * 6, // staggered appearance
          size: Math.random() * 40 + 100 // 60-80px diameter
        });
      }
    }
    setBalls(newBalls);
    setShowBalls(true);

     setTimeout(() => {
    setShowBalls(false);
  }, 8000);
  };

  const getBallColor = (num) => {
    if (num <= 15) return 'bg-blue-600';
    if (num <= 30) return 'bg-red-600';
    if (num <= 45) return 'bg-green-600';
    if (num <= 60) return 'bg-yellow-500';
    return 'bg-purple-600';
  };

  const clearBalls = () => setBalls([]);

  return (
    <div className="w-screen h-screen bg-sky-200 p-2 font-sans overflow-hidden">
      
  {/* TOP ROW */}
  <div className="grid grid-cols-4 gap-2 h-1/2">
    {/* Current Call Circle */}
    <div className="flex items-center justify-center bg-blue-900">
      <div className="bg-white rounded-full border-[12px] border-black w-72 h-72 flex items-center justify-center text-black text-8xl font-bold">
       {currentCall
            ? `${getCategory(currentCall)}${currentCall.toString().padStart(2, '0')}`
            : ''}
      </div>
      
    </div>
       {/* Ball display area */}
     {showBalls && (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
    {balls.map((ball, index) => (
      <div
        key={index}
        className={`
          absolute rounded-full flex items-center justify-center
          text-white font-bold shadow-xl
          ${getBallColor(ball.number)}
          animate-float-in
        `}
        style={{
          left: `${ball.left}%`,
          top: `${ball.top}%`,
          transform: `rotate(${ball.rotation}deg)`,
          width: `${ball.size}px`,
          height: `${ball.size}px`,
          animationDelay: `${ball.delay}s`,
          zIndex: index
        }}
      >
        <span className={`transform -rotate-[${ball.rotation}deg]`}>
          {ball.number}
        </span>
      </div>
    ))}
  </div>
)}

    {/* Recent Calls */}
   {/* Recent Calls - now using currentCall array */}
      <div className="relative bg-blue-900 p-4 rounded-lg shadow-lg flex flex-col items-center">
  <div className="text-white text-2xl font-bold mb-4 text-center">
    Recent Calls
  </div>

  <div className="flex flex-col items-center gap-3 relative">
    {[...calledNumbers.slice(0, 3)].map((n, i) => (
      <div
        key={i}
        className={`
          w-14 h-14 flex items-center justify-center
          rounded-full text-xl font-bold
          ${i === 0 
            ? 'bg-red-600 text-white border-2 border-yellow-400 animate-pulse' 
            : 'bg-white text-blue-900 border-2 border-blue-700'
          }
          transition-all duration-300 transform hover:scale-110
          shadow-md
        `}
      >
        {n ? n.toString().padStart(2, '0') : '--'}
      </div>
    ))}

    {/* Fill empty slots if less than 3 calls */}
    {Array.from({ length: 3 - calledNumbers.length }).map((_, i) => (
      <div
        key={`empty-${i}`}
        className="w-14 h-14 rounded-full bg-gray-300 border-2 border-gray-400 flex items-center justify-center text-gray-500"
      >
        --
      </div>
    ))}

    {/* 🔵 Single Counter on the right */}
    <div className="absolute left-20 top-1/2 -translate-y-1/2">
      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-300 text-blue-900 font-bold text-lg shadow-md">
        {calledNumbers.length}
      </div>
    </div>
  </div>
</div>


    {/* Prize / Amharic Panel */}
    <div className="bg-blue-900 text-center text-white flex flex-col items-center justify-center">
      <div className="text-6xl font-bold mb-10">ደራሽ</div>
      <div className="text-6xl font-bold">{prize}</div>
      <div className="mt-2 text-lg tracking-wide">09-94-02-78-28</div>
    </div>

   <div className="bg-white p-4 rounded-lg shadow-lg">
  {/* Column Headers */}
  <div className="grid grid-cols-5 gap-1 mb-1">
    {['B', 'I', 'N', 'G', 'O'].map((letter) => (
      <div 
        key={letter}
        className="text-center text-2xl font-bold text-red-600 uppercase"
      >
        {letter}
      </div>
    ))}
  </div>

  {/* Pattern Grid */}
  <div className="grid grid-cols-5 grid-rows-5 gap-1 ml-4">
    {bingoPattern.map((filled, idx) => (
      <div
        key={idx}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-300
          ${filled 
            ? 'bg-red-600 shadow-lg shadow-red-400/50 animate-pulse' 
            : 'bg-gray-100 border-2 border-gray-300'
          }
        `}
      >
        {filled && (
          <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
        )}
      </div>
    ))}
  </div>
</div>
    
  </div>

  {/* NUMBERS GRID */}
<div className="flex-1 p-6 rounded-xl relative">
  <div className="grid grid-cols-16 gap-2 text-center font-semibold text-base">
    {Object.entries(CATEGORIES).map(([letter, [min, max]]) => (
      <React.Fragment key={letter}>
        {/* Letter column */}
        <div className="col-span-1 flex items-center justify-center text-xl text-white font-bold uppercase bg-red-600 border border-slate-300 rounded shadow">
          {letter}
        </div>

        {/* Numbers under the letter */}
        {Array.from({ length: max - min + 1 }).map((_, colIndex) => {
          const num = min + colIndex;
          const isCurrent = num === currentCall;
          const isCalled = calledNumbers.includes(num);
          const isNewCall = isCurrent && calledNumbers[0] === num;

          return (
            <div 
              key={num}
              className="relative col-span-1"
              style={{ height: '48px' }}
            >
              <div className={`
                absolute inset-0 flex items-center justify-center
                ${isCurrent ? 'bg-red-600' : isCalled ? 'bg-red-600' : 'bg-blue-900'}
                text-white font-bold text-xl
                transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${isNewCall ? 'animate-perfect-center-pop' : ''}
                origin-center
              `}>
                {num.toString().padStart(2, '0')}
              </div>
            </div>
          );
        })}
      </React.Fragment>
    ))}
  </div>
</div>


  {/* CONTROLS */}
  <div className="flex justify-between items-center mt-1">
    <button
          onClick={togglePlayPause}
          className={`flex items-center justify-center px-4 py-2 rounded-xl font-semibold shadow transition transform hover:scale-105 ${
            isRunning
              ? 'bg-red-600 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          {isRunning ? <Pause size={20} className="mr-2" /> : <Play size={20} className="mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
    <button onClick={generateRandomBalls} className="bg-yellow-600 text-white px-4 py-2 rounded">ፐዉዝ</button>
    <select className="border px-2 py-1 rounded">
      <option>Amharic1</option>
    </select>
    <select className="border px-2 py-1 rounded">
      <option>7 second interval</option>
      <option>6 second interval</option>
    </select>
    <div className="flex flex-col sm:flex-row gap-3 w-40">
      <input
        type="number"
        placeholder="Enter Card ID"
        value={manualCardId}
        onChange={(e) => setManualCardId(e.target.value)}
        className="flex-grow w-full bg-white border border-slate-300 text-slate-800 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-0"
      />
     <button
        onClick={handleManualCheck}
         disabled={isLoading}
              className={`bg-slate-800 hover:bg-green-700 text-white px-4 py-2 rounded font-bold mt-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
      >
        {isLoading ? 'Checking...' : 'Check'}
      </button>
    </div>
    <button onClick={restartGame} className="bg-yellow-600 text-white px-4 py-2 rounded">Register Cartela</button>
    
  
  </div>
   <WinningCardsModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    winningCardIds={winningCards}
    allBingoCards={bingoCardsData}
    calledNumbers={new Set(calledNumbers)}
    initialManualCardId={selectedCardId}
    winningPattern={winningPattern}
    selectedCards={selectedCards}
  />
</div>


  );
}