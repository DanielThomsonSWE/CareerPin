const BRAND_COLORS = ['#2D6A4F', '#C06C3B', '#4D6C8A', '#8064A2', '#B07A32', '#3A7D7C'];

export function getBrandMark(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : company.slice(0, 2)).toUpperCase();
}

export function getBrandColor(company: string): string {
  const hash = [...company].reduce((total, character) => total + character.charCodeAt(0), 0);
  return BRAND_COLORS[hash % BRAND_COLORS.length];
}
