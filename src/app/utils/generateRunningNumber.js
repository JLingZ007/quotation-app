// utils/generateRunningNumber.js
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * สร้างรหัสลำดับอัตโนมัติแบบ YYMMNNN
 * @param {string|null} lastNumber รหัสลำดับล่าสุด เช่น "2505001"
 * @returns {string} รหัสถัดไป เช่น "2505002"
 */
export function generateRunningNumber(lastNumber) {
  const now = new Date();
  const year = String(now.getFullYear() % 100).padStart(2, '0'); // เช่น "25"
  const month = String(now.getMonth() + 1).padStart(2, '0');     // เช่น "05"

  let nextSeq = 1;
  if (lastNumber && /^\d{7}$/.test(lastNumber)) {
    nextSeq = parseInt(lastNumber.slice(-3), 10) + 1;
  }
  const seqStr = String(nextSeq).padStart(4, '0');                // เช่น "0002"

  return `${year}${month}${seqStr}`;                              // เช่น "25050002"
}

/**
 * ดึงรหัสล่าสุดจาก Firestore แล้วคืนรหัสถัดไป
 * @returns {Promise<string>} รหัสถัดไป
 */
export async function getNextRunningNumber() {
  const q = query(
    collection(db, 'quotes'),
    orderBy('runningNumber', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  const lastNumber = snap.empty ? null : snap.docs[0].data().runningNumber;
  return generateRunningNumber(lastNumber);
}
