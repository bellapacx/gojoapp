// services/api.js
export async function submitWinning({ cardId, roundId, shopId, prize }) {
  const response = await fetch('http://127.0.0.1:8000/winings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      card_id: cardId,
      round_id: roundId,
      shop_id: shopId,
      prize: prize,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to submit winning');
  }

  return await response.json();
}
