
// Simulation of Clients.tsx logic

const history = [
    // Old movement (outside 1 month window)
    { date: '2025-01-01', type: 'Inclusão', amount: 100000, negotiatedValue: 1850 },
    // Recent movement (inside 1 month window)
    { date: '2026-01-20', type: 'Venda', amount: 100000, negotiatedValue: 2000, profit: 150 }
];

const programs = [
    { name: 'Livelo', balance: 0 } // Sold everything
];

// Current State
const totalPoints = programs.reduce((acc, p) => acc + p.balance, 0); // 0
const totalValue = totalPoints * 0.0185; // 0

// Report Period: 1 Month
const now = new Date('2026-01-22');
const startDate = new Date(now);
startDate.setMonth(now.getMonth() - 1); // 2025-12-22

const fHistory = history.filter(h => new Date(h.date) >= startDate);
// fHistory only contains the 'Venda'

// Calculate "Total Invested" explicitly on fHistory (Current Logic)
const totalInvestedPeriod = fHistory
    .filter(h => h.type === 'Compra' || h.type === 'Inclusão')
    .reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);

console.log('Total Invested (Period):', totalInvestedPeriod); // 0

// ROI (Period)
const roiPeriod = fHistory
    .filter(h => h.type === 'Venda')
    .reduce((acc, h) => acc + (h.negotiatedValue || 0), 0);

console.log('ROI (Period):', roiPeriod); // 2000

// Evolution Calculation (Current Logic)
// ((Current Value + ROI) - Invested) / Invested
try {
    let evolution = 0;
    if (totalInvestedPeriod > 0) {
        evolution = (((totalValue + roiPeriod) - totalInvestedPeriod) / totalInvestedPeriod) * 100;
    } else if ((totalValue + roiPeriod) > 0) {
        evolution = 100; // treated as 100% pure profit? Or Infinite?
        // Actually code said: if invested > 0 ... else if (val+roi > 0) -> 100.
    }
    console.log('Evolution %:', evolution);
} catch (e) {
    console.log('Error:', e);
}


// SCENARIO 2: Negative Balance + Tiny Investment (User Scenario)
const historyBad = [
    { date: '2026-01-20', type: 'Venda', amount: 100000, negotiatedValue: 2000 }, // Sold 100k
    // Forgot to add Inclusão
];
const programsBad = [{ name: 'Latam', balance: -100000 }];

const totalPointsBad = -100000;
const totalValueBad = totalPointsBad * 0.0185; // -1850

const fHistoryBad = historyBad; // All recent
const totalInvestedBad = 0; // No buys
const roiBad = 2000;

// Numerator: (-1850 + 2000) = 150.
// Denominator: 0.
// Result: 150 / 0 = Infinity (or handled as 100%)

// SCENARIO 3: Tiny Investment (1 real) + Negative Balance
const historyTiny = [
    { date: '2026-01-20', type: 'Inclusão', amount: 100, negotiatedValue: 1 }, // 1 real
    { date: '2026-01-21', type: 'Venda', amount: 200000, negotiatedValue: 4000 } // Sold 200k (Short selling!)
];
const programsTiny = [{ name: 'Latam', balance: -199900 }];
const valTiny = -199900 * 0.0185; // -3698.15
const investTiny = 1;
const roiTiny = 4000;

// Numerator: (-3698.15 + 4000) - 1 = 300.85
// Denom: 1.
// Evol: 30085% (Positive?)

// Wait, user had NEGATIVE evolution.
// Means Numerator was Negative.
// Val + ROI < Invested.
// -5000 + 4000 = -1000.
// -1000 - 1 = -1001.
// -1001 / 1 = -100100%. Matches!

console.log('Scenario 3 Result:', (((valTiny + roiTiny) - investTiny) / investTiny) * 100);
