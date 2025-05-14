'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';

export default function HistoryPage() {
  const [quotes, setQuotes] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);

  const fetchQuotes = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const baseQuery = query(
      collection(db, 'quotes'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const pagedQuery = lastDoc ? query(baseQuery, startAfter(lastDoc)) : baseQuery;
    const snapshot = await getDocs(pagedQuery);

    if (snapshot.empty) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    const dataWithNames = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let brandName = '-';
        let modelName = '-';
        let serviceNames = [];
        let warrantyName = '-';
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000).toLocaleString()
          : '-';

        try {
          if (data.brand) {
            const brandSnap = await getDoc(doc(db, 'brands', data.brand));
            if (brandSnap.exists()) brandName = brandSnap.data().name;
          }

          if (data.model) {
            const modelSnap = await getDoc(doc(db, 'brands', data.brand, 'models', data.model));
            if (modelSnap.exists()) modelName = modelSnap.data().name;
          }

          if (data.items) {
            for (let item of data.items) {
              const serviceSnap = await getDoc(doc(db, 'services', item.serviceId));
              if (serviceSnap.exists()) serviceNames.push(serviceSnap.data().name);
            }
          }

          if (data.warranty) {
            const warrantySnap = await getDoc(doc(db, 'warrantyConditions', data.warranty));
            if (warrantySnap.exists()) warrantyName = warrantySnap.data().name;
          }
        } catch (err) {
          console.error('⚠️ fetch error:', err);
        }

        return {
          id: docSnap.id,
          customerName: data.customerName || '-',
          brandName,
          modelName,
          license: data.license || '-',
          serviceNames,
          warrantyName,
          createdAt,
        };
      })
    );

    setQuotes((prev) => {
      const all = [...prev, ...dataWithNames];
      return Array.from(new Map(all.map(q => [q.id, q])).values());
    });

    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setLoading(false);
  }, [lastDoc, loading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchQuotes();
    }, { threshold: 1 });

    const current = observerRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
      observer.disconnect();
    };
  }, [fetchQuotes]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">ประวัติใบเสนอราคา</h1>

      <div className="overflow-auto rounded shadow border max-h-[500px]">
        <table className="table-auto w-full border-collapse text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="border px-4 py-2 text-left">ลูกค้า</th>
              <th className="border px-4 py-2 text-left">รถ</th>
              <th className="border px-4 py-2 text-left">ทะเบียน</th>
              <th className="border px-4 py-2 text-left">บริการ</th>
              <th className="border px-4 py-2 text-left">วันที่สร้าง</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{q.customerName}</td>
                <td className="border px-4 py-2">{q.brandName} {q.modelName}</td>
                <td className="border px-4 py-2">{q.license}</td>
                <td className="border px-4 py-2">{q.serviceNames.join(', ') || '-'}</td>
                <td className="border px-4 py-2">{q.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div ref={observerRef} className="text-center py-4 text-gray-500">
        {loading
          ? 'กำลังโหลดเพิ่มเติม...'
          : hasMore
          ? 'เลื่อนเพื่อโหลดเพิ่ม'
          : 'แสดงข้อมูลครบแล้ว'}
      </div>
    </div>
  );
}
