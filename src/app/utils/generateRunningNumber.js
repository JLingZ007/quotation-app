import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function generateRunningNumber(lastNumber) {
  const now = new Date();
  const year = String(now.getFullYear() % 100).padStart(2, '0'); // เช่น "25"
  const month = String(now.getMonth() + 1).padStart(2, '0');     // เช่น "05"

  let nextSeq = 1;
  if (lastNumber && /^\d{7}$/.test(lastNumber)) {
    nextSeq = parseInt(lastNumber.slice(-3), 10) + 1;
  }
  const seqStr = String(nextSeq).padStart(3, '0'); // 3 หลัก เช่น 001

  return `${year}${month}${seqStr}`; // เช่น "2505001"
}

export async function getNextRunningNumber() {
  const now = new Date();
  const prefix = `${String(now.getFullYear() % 100).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}`; // "2505"

  const q = query(
    collection(db, 'quotes'),
    orderBy('runningNumber', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);

  // ✅ คัดกรองเฉพาะรหัสที่ขึ้นต้นด้วยเดือน/ปีปัจจุบัน
  const last = snap.docs.find(d => d.data().runningNumber?.startsWith(prefix));

  const lastNumber = last?.data().runningNumber || null;

  return generateRunningNumber(lastNumber);
}
