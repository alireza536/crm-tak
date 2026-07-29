export function formatMoney(value: number | string){
  const num = typeof value === "string"
    ? Number(value.replace(/[^0-9]/g,""))
    : value;

  return new Intl.NumberFormat("fa-IR").format(num || 0) + " ریال";
}

export function formatNumber(value:number|string){
  const num = typeof value === "string"
    ? Number(value.replace(/[^0-9]/g,""))
    : value;

  return new Intl.NumberFormat("fa-IR").format(num || 0);
}
