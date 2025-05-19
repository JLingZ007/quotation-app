// ฟังก์ชัน number format ที่ยังไม่มีใน utils
export const numberWithCommas = (x) => {
    if (x === undefined || x === null) return '0';
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};