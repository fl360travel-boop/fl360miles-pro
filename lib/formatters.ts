/**
 * Utilitários de formatação numérica padrão brasileiro
 * 
 * Padrão BR:
 * - Ponto (.) para separação de milhar
 * - Vírgula (,) para casas decimais
 * 
 * Exemplos:
 * - 1.000 (mil)
 * - 10.000 (dez mil)
 * - 1.000.000 (um milhão)
 * - 36.900,50 (com centavos)
 */

/**
 * Formata um número inteiro no padrão brasileiro
 * @param value - Número a ser formatado
 * @returns String formatada (ex: "1.000.000")
 */
export const formatNumber = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString('pt-BR');
};

/**
 * Formata um valor monetário no padrão brasileiro (com 2 casas decimais)
 * @param value - Valor a ser formatado
 * @param showSymbol - Se deve incluir "R$" (default: true)
 * @returns String formatada (ex: "R$ 1.000,50")
 */
export const formatCurrency = (value: number | string, showSymbol = true): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return showSymbol ? 'R$ 0,00' : '0,00';
    const formatted = num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return showSymbol ? `R$ ${formatted}` : formatted;
};

/**
 * Formata um valor decimal no padrão brasileiro
 * @param value - Valor a ser formatado
 * @param decimals - Número de casas decimais (default: 2)
 * @returns String formatada (ex: "1.234,56")
 */
export const formatDecimal = (value: number | string, decimals = 2): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Formata milhas no padrão brasileiro
 * @param value - Quantidade de milhas
 * @param showSuffix - Se deve incluir "mi" (default: false)
 * @returns String formatada (ex: "100.000" ou "100.000 mi")
 */
export const formatMiles = (value: number | string, showSuffix = false): string => {
    const formatted = formatNumber(value);
    return showSuffix ? `${formatted} mi` : formatted;
};

/**
 * Formata porcentagem no padrão brasileiro
 * @param value - Valor percentual
 * @param decimals - Casas decimais (default: 1)
 * @returns String formatada (ex: "15,5%")
 */
export const formatPercent = (value: number | string, decimals = 1): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0%';
    return `${num.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}%`;
};
