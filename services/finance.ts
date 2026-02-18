
export interface ExchangeRate {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
}

export async function getDollarRate(): Promise<ExchangeRate | null> {
    try {
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.USDBRL;
    } catch (error) {
        console.error('Failed to fetch dollar rate:', error);
        return null;
    }
}
