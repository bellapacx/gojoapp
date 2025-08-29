import React, { useState } from "react";

const createEmptyCard = (id) => ({
  B: Array(5).fill(null),
  I: Array(5).fill(null),
  N: Array(5).fill(null).map((v, i) => (i === 2 ? null : v)), // center free
  G: Array(5).fill(null),
  O: Array(5).fill(null),
  card_id: id,
});

export default function BingoCardCreator() {
  const [cards, setCards] = useState([createEmptyCard(1)]);
  const [shopId, setShopId] = useState("");

  const handleChange = (cardIndex, column, rowIndex, value) => {
    setCards((prev) => {
      const updated = [...prev];
      updated[cardIndex][column][rowIndex] =
        value === "" ? null : Number(value);
      return updated;
    });
  };

  const addCard = () => {
    setCards((prev) => [...prev, createEmptyCard(prev.length + 1)]);
  };

  const generateJSON = () => {
    if (!shopId) {
      alert("Please enter a Shop ID first.");
      return;
    }

    const jsonData = JSON.stringify(cards, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${shopId}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-slate-700">Bingo Card Creator</h1>

      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium text-slate-700">Shop ID:</label>
        <input
          type="text"
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
          className="border rounded p-2"
          placeholder="Enter Shop ID"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card, cardIndex) => (
          <div
            key={card.card_id}
            className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200"
          >
            <div className="bg-slate-800 text-white text-center font-bold py-2">
              Card #{card.card_id}
            </div>
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-200">
                  {["B", "I", "N", "G", "O"].map((col) => (
                    <th key={col} className="p-2 border border-slate-300">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((rowIndex) => (
                  <tr key={rowIndex}>
                    {["B", "I", "N", "G", "O"].map((col) => (
                      <td key={col} className="border border-slate-300 p-1">
                        <input
                          type="number"
                          value={card[col][rowIndex] ?? ""}
                          onChange={(e) =>
                            handleChange(
                              cardIndex,
                              col,
                              rowIndex,
                              e.target.value
                            )
                          }
                          className="w-12 text-center border rounded p-1"
                          disabled={col === "N" && rowIndex === 2} // free space
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={addCard}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Add New Card
        </button>
        <button
          onClick={generateJSON}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Save JSON
        </button>
      </div>
    </div>
  );
}
