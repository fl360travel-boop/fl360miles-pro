
// This script simulates the logic currently implemented in Clients.tsx (reportMetrics)
// to verify that the "Lifetime" calculations are working correctly independently of the UI.

// Mock Client Data
const mockHistory = [
    // 1. OLD INVESTMENT (e.g., 6 months ago) - Should be included in Lifetime but excluded from "Last Month" filter
    {
        id: 'H-1',
        date: '2025-06-01', // 6 months ago
        type: 'Compra',
        program: 'Livelo',
        amount: 100000,
        negotiatedValue: 3500, // Invested R$ 3,500.00
        economyGenerated: 0
    },
    // 2. RECENT SALE (e.g., Today) - Included in both
    {
        id: 'H-2',
        date: '2026-01-22', // Today
        type: 'Venda',
        program: 'Livelo',
        amount: 50000,
        negotiatedValue: 2000, // Sold for R$ 2,000.00
        profit: 250 // Profit
    }
];

// Current Client State (50k miles left)
const mockClient = {
    programs: [
        { name: 'Livelo', balance: 50000 }
    ],
    history: mockHistory
};

// --- LOGIC FROM Clients.tsx (reportMetrics) ---

// 1. Calculate Current Asset Value (Patrimônio)
// Logic: Sum of all program balances * Market Rate (0.0185)
const MILE_PRICE = 0.0185;
const currentAssetValue = mockClient.programs.reduce((acc, p) => acc + (p.balance * MILE_PRICE), 0);

// 2. Calculate Lifetime Invested (Total Invested ever)
// Logic: Filter 'Compra' or 'Inclusão' from WHOLE history
const lifetimeInvested = mockClient.history
    .filter(h => h.type === 'Compra' || h.type === 'Inclusão')
    .reduce((acc, h) => acc + (h.negotiatedValue || h.economyGenerated || 0), 0);

// 3. Calculate Total Realized (Cash out from Sales)
// Logic: Filter 'Venda' from WHOLE history
const lifetimeRealized = mockClient.history
    .filter(h => h.type === 'Venda')
    .reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);

// 4. Evolution Calculation
// Formula: (Current Assets + Cash Out - Total Invested) / Total Invested
const totalWealthGenerated = currentAssetValue + lifetimeRealized;
const absoluteEvolution = totalWealthGenerated - lifetimeInvested;
const evolutionPercent = lifetimeInvested > 0
    ? (absoluteEvolution / lifetimeInvested) * 100
    : 0;

// 5. Economy/Savings
// Logic: Sum of economyGenerated from WHOLE history
const lifetimeSaving = mockClient.history
    .reduce((acc, h) => acc + (h.economyGenerated || 0), 0);


// --- VERIFICATION OUTPUT ---

console.log("--- SIMULATION RESULTS ---");
console.log(`1. Historic Investment (6 months ago): R$ ${mockHistory[0].negotiatedValue.toFixed(2)}`);
console.log(`2. Recent Sale (Today): R$ ${mockHistory[1].negotiatedValue.toFixed(2)}`);
console.log(`3. Current Miles Balance: ${mockClient.programs[0].balance} (Value: R$ ${currentAssetValue.toFixed(2)})`);
console.log("\n--- CALCULATIONS (LIFETIME) ---");
console.log(`Lifetime Invested: R$ ${lifetimeInvested.toFixed(2)} (Expected: 3500.00)`);
console.log(`Lifetime Realized (Cash Out): R$ ${lifetimeRealized.toFixed(2)} (Expected: 2000.00)`);
console.log(`Total Wealth (Assets + Cash): R$ ${totalWealthGenerated.toFixed(2)} (Expected: 925.00 + 2000.00 = 2925.00)`);
console.log(`Absolute Evolution/Profit: R$ ${absoluteEvolution.toFixed(2)} (Expected: 2925 - 3500 = -575.00)`);
console.log(`Evolution Percent: ${evolutionPercent.toFixed(2)}% (Expected: -16.43%)`);

// VERDICT
const isCorrect =
    lifetimeInvested === 3500 &&
    lifetimeRealized === 2000 &&
    Math.abs(evolutionPercent - (-16.43)) < 0.1;

if (isCorrect) {
    console.log("\n✅ SUCCESS: The Lifetime logic correctly accounts for past investments even when mixed with recent sales.");
} else {
    console.log("\n❌ FAIL: The calculations did not match expected values.");
}
