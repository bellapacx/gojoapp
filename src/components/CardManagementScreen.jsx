import React, { useState, useEffect } from 'react';

const TOTAL_CARDS = 200;

export default function CardManagementScreen({ round ,selectedCards, setCurrentView, patterns }) {
  const [selectedCardState, setSelectedCardState] = useState([]);
   const [rounds, setRound] = useState(1);
  const [bet, setBet] = useState(10);
  const [commission] = useState('20%');
  const [interval] = useState('4 sec');
  const [pattern, setPattern] = useState('1 Line');
  const [language] = useState('Amharic');
  const [balance, setBalance] = useState(0);
   const [commission_rate, setCommission] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize selected cards from props
  useEffect(() => {
    if (selectedCards && selectedCards.length > 0) {
      setSelectedCardState(selectedCards);
    }
    setPattern(patterns || '1 Line');
  }, [selectedCards]);
  // Auto-load last round
useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedRounds = JSON.parse(localStorage.getItem('dailyRounds') || '{}');
    const todayRound = storedRounds[today] || 1;

    // Use propRound if passed, otherwise use today's stored round
    if (round) {
      setRound(round);
    } else {
      setRound(todayRound);
    }
  }, [round]);

// Refresh cards
const handleRefresh = async () => {
  try {
    const shopId = localStorage.getItem("shopid");
    if (!shopId) return;

    const res = await fetch(`https://gojbingoapi.onrender.com/round/${shopId}`);
    if (!res.ok) throw new Error("Failed to fetch round data");

    const data = await res.json();

    // If a round is active, mark its selected cards
    if (data && data.selectedCards) {
      setSelectedCardState(data.selectedCards);
    } else {
      setSelectedCardState([]); // fallback if no round
    }
  } catch (err) {
    console.error("Error refreshing round data:", err);
    setSelectedCardState([]);
  }
};


 // Fetch balance and commission rate
useEffect(() => {
  const fetchShopData = async () => {
    try {
      const shop_id = localStorage.getItem('shopid');
      const res = await fetch(`https://gojbingoapi.onrender.com/shop/${shop_id}`);
      if (!res.ok) throw new Error('Failed to fetch shop data');

      const { balance, commission_rate } = await res.json();
      setBalance(balance);
      setCommission(commission_rate); // Assuming you have a state for commission
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  fetchShopData();
}, []);

  // Toggle card selection
  const toggleCard = (num) => {
    setSelectedCardState(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  // Refresh cards
  

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    setCurrentView({ name: 'login' });
  };

  // Calculate prize
const calculatePrize = () => {
  const numSelected = selectedCardState.length;

  // Ensure commissionRate is a number between 0 and 1
  const rate = commission_rate != null
    ? parseFloat(commission_rate)
    : 0.2; // default 10% if undefined

  return numSelected * bet * (1 - rate);
};


  // Start game
  const startGame = async () => {
    if (selectedCardState.length === 0) {
      alert('Please select at least one card');
      return;
    }

    setIsLoading(true);
    try {
      const shopId = localStorage.getItem('shopid');
      

      setCurrentView({
        name: "dashboard",
        props: {
          shopId,
          prize: calculatePrize(),
          selectedCards: selectedCardState,
          interval: parseInt(interval)*1000,
          language,
          betPerCard: bet,
          commissionRate: parseFloat(commission)/100,
          winningPattern: pattern,
        },
      });
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to start game");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col">
      {/* Top Header - unchanged */}
      <header className="w-full bg-white text-black flex items-center justify-between px-6 py-2">
        <div className="font-bold">logo here</div>
        <div className="text-green-600 font-semibold">📞 09-94-02-78-28</div>
        <button onClick={handleLogout} className="text-green-600 hover:underline">Logout</button>
      </header>

      {/* Main Section - unchanged */}
      <main className="flex-1 flex flex-col items-center mt-6">
        {/* Title + Refresh - now connected */}
        <div className="flex items-center justify-center mb-6 w-[calc(10*80px+9*16px)]">
          <div className="bg-orange-600 text-white text-xl font-bold px-6 py-2 rounded-l">
            Select Cartela for round  {rounds}
          </div>
          <button 
            onClick={handleRefresh}
            className="bg-orange-600 text-white px-4 py-2 rounded-r hover:bg-orange-700"
          >
            REFRESH
          </button>
        </div>

        {/* Content Area (Grid + Right Controls) - unchanged except toggleCard */}
        <div className="flex items-start gap-10">
          {/* Bingo Grid - unchanged except onClick */}
          <div className="grid grid-cols-10 gap-4 overflow-y-auto max-h-[80vh] scrollbar-hide">
            {Array.from({ length: 200 }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedCardState.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => toggleCard(num)}
                  className={`w-16 h-16 rounded-full border-2 font-bold text-lg 
                    ${isSelected 
                      ? 'bg-green-500 text-white border-green-700' 
                      : 'bg-orange-600 text-white border-blue-500 hover:bg-orange-700'}`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Right Controls - unchanged except onChange handlers */}
          <div className="flex flex-col items-start text-blue-400 space-y-4">
            <p>
              award: <span className="text-white font-bold">{calculatePrize()}</span>
            </p>

            <label className="flex items-center gap-2">
              <span>stake</span>
              <input
        type="number"
        value={bet}
        onChange={(e) => setBet(Number(e.target.value))}
        className="w-20 py-1 rounded-md text-black bg-white"
      />
            </label>

            <label className="flex items-center gap-2">
              <span>pattern</span>
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="text-black bg-white rounded px-2 py-1"
              >
                 <option>1 Line</option>
        <option>2 Lines</option>
        <option>Four Corners</option>
        <option>Cross</option>
        <option>Inner Corners + Center</option>
        <option>Full House</option>
                <option>All</option>
              </select>
            </label>

            <button
              onClick={startGame}
              disabled={isLoading}
              className={`bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold mt-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Loading...' : 'Play'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}