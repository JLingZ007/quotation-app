// utils/generateRunningNumber.js
/**
 * สร้างรหัสลำดับอัตโนมัติแบบ YYMMNNN
 * YY: ปี ค.ศ. สองหลัก (เช่น 2025 -> 25)
 * MM: เดือน สองหลัก (01-12)
 * NNN: ลำดับสามหลัก โดยหากมีค่าเดิมจะ +1 หากไม่มีจะเริ่มที่ 001
 *
 * @param {string} lastNumber รหัสลำดับล่าสุดในรูปแบบ "YYMMNNN" (optional)
 * @returns {string} รหัสลำดับถัดไป เช่น "2505001"
 */
export function generateRunningNumber(lastNumber) {
  const now = new Date();
  // ปี ค.ศ. สองหลัก
  const year = String(now.getFullYear() % 100).padStart(2, '0');
  // เดือน สองหลัก
  const month = String(now.getMonth() + 1).padStart(2, '0');

  let nextSeq = 1;
  if (lastNumber && /^\d{7}$/.test(lastNumber)) {
    // ดึงลำดับ 3 หลักสุดท้าย
    const lastSeq = parseInt(lastNumber.slice(-3), 10);
    nextSeq = lastSeq + 1;
  }
  // แปลงเป็น 3 หลัก เช่น 1 -> "001"
  const seqStr = String(nextSeq).padStart(3, '0');

  return `${year}${month}${seqStr}`;
}
