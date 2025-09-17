import React, { useEffect, useState } from 'react';

export default function ModalReport({ show, onClose, shopId }) {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null); // 👈 Add this
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (show && shopId) {
      setLoading(true);
      setError(null);
      fetch(`https://bingo-api-production-1b06.up.railway.app/report/${shopId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch reports');
          return res.json();
        })
        .then((data) => {
  setReportData(Array.isArray(data.games) ? data.games : []);
  setBalance(data.balance ?? null); // 👈 Set balance
})
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [show, shopId]);

  if (!show) return null;

  // Filter logic for date range
  const filteredData = Array.isArray(reportData)
    ? reportData.filter(row => {
        const rowDate = row.date || (row.started_at ? row.started_at.slice(0, 10) : '');
        if (dateFrom && rowDate < dateFrom) return false;
        if (dateTo && rowDate > dateTo) return false;
        return true;
      })
    : [];

  // Calculate total commission amount
  const totalCommission = filteredData.reduce((sum, row) => sum + (Number(row.commission_amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal background with gradient and blur, no black overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 opacity-80 backdrop-blur-md" />
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-3xl mx-4">
        <button
          className="absolute top-3 right-4 text-white text-3xl font-bold hover:text-red-400 transition"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-3xl font-extrabold mb-6 text-blue-300 drop-shadow">Reports</h2>
        <div className="text-lg font-bold text-white bg-white/10 px-4 py-2 rounded shadow">
        Balance:{" "}
  <span className="text-green-400">
    {balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'Loading...'}
  </span>
  </div>
        {/* Date range filter */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label htmlFor="date-from" className="text-white/80 font-semibold">Date from:</label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <label htmlFor="date-to" className="text-white/80 font-semibold">to</label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 rounded bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="ml-2 px-2 py-1 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition"
            >
              Clear
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-blue-200 font-semibold">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400 font-semibold">{error}</div>
          ) : (
            <>
              <div className="max-h-[400px] overflow-y-auto rounded-xl">
                <table className="min-w-full border border-white/20 rounded-xl overflow-hidden shadow-lg">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 text-white">
                      <th className="px-4 py-3 border-b border-white/20 font-bold">#</th>
                      <th className="px-4 py-3 border-b border-white/20 font-bold">Date</th>
                      <th className="px-4 py-3 border-b border-white/20 font-bold">Game ID</th>
                      <th className="px-4 py-3 border-b border-white/20 font-bold">Prize</th>
                      <th className="px-4 py-3 border-b border-white/20 font-bold">Cards</th>
                      <th className="px-4 py-3 border-b border-white/20 font-bold">Commision amount</th>
                      {/* Add more columns as needed */}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredData) && filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-blue-200 bg-white/5">
                          No reports found.
                        </td>
                      </tr>
                    ) : (
                      Array.isArray(filteredData) && filteredData.map((row, idx) => (
                        <tr
                          key={row.id || row.round_id || idx}
                          className={
                            idx % 2 === 0
                              ? 'bg-blue-900/60 hover:bg-blue-800/80 text-white'
                              : 'bg-purple-900/60 hover:bg-purple-800/80 text-white'
                          }
                        >
                          <td className="px-4 py-2 border-b border-white/10 text-center">{idx + 1}</td>
                          <td className="px-4 py-2 border-b border-white/10 text-center">{row.date || row.started_at?.slice(0, 10) || '-'}</td>
                          <td className="px-4 py-2 border-b border-white/10 text-center font-mono text-xs">{row.gameId || row.round_id || '-'}</td>
                          <td className="px-4 py-2 border-b border-white/10 text-center text-green-300 font-bold">{row.prize || '-'}</td>
                          <td className="px-4 py-2 border-b border-white/10 text-center">{row.selected_cards?.length || '-'}</td>
                          <td className="px-4 py-2 border-b border-white/10 text-center">{row.commission_amount || '-'}</td>
                          {/* Add more cells as needed */}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Floating total commission bar */}
              <div className="mt-4 sticky bottom-0 left-0 w-full z-20">
                <div className="flex justify-end items-center bg-gradient-to-r from-blue-800 via-purple-800 to-indigo-800 rounded-xl shadow-lg px-6 py-4 border border-white/20">
                  <span className="text-lg font-bold text-white mr-4">Total Commission Amount:</span>
                  <span className="text-2xl font-extrabold text-green-300">{totalCommission.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 
