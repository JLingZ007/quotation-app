export function numberToThaiText(num) {
  const numberText = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positionText = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  if (typeof num !== 'number') {
    num = parseFloat(num);
  }

  if (isNaN(num)) return "ไม่สามารถแปลงได้";

  const [integerPart, decimalPart] = num.toFixed(2).split(".");
  let bahtText = "";

  const processSegment = (segment) => {
    let result = "";
    const len = segment.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(segment[i]);
      const position = len - i - 1;
      if (digit === 0) continue;
      if (position === 0 && digit === 1 && len > 1) {
        result += "เอ็ด";
      } else if (position === 1 && digit === 2) {
        result += "ยี่";
      } else if (position === 1 && digit === 1) {
        result += "";
      } else {
        result += numberText[digit];
      }
      result += positionText[position];
    }
    return result;
  };

  let int = parseInt(integerPart);
  if (int === 0) {
    bahtText = "ศูนย์บาท";
  } else {
    const intStr = integerPart.toString();
    let segment = intStr;
    let result = "";
    while (segment.length > 0) {
      const part = segment.slice(-6);
      segment = segment.slice(0, -6);
      result = (segment.length > 0 ? processSegment(part) + "ล้าน" : processSegment(part)) + result;
    }
    bahtText = result + "บาท";
  }

  if (decimalPart === "00") {
    bahtText += "ถ้วน";
  } else {
    const satang = processSegment(decimalPart);
    bahtText += satang + "สตางค์";
  }

  return bahtText;
}
