'use client'
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center space-y-4">
        <h1 className="text-2xl font-bold mb-6">Thuengkaen Elite Shield</h1>

        <button onClick={() => router.push('/form')} className="bg-gray-200 px-6 py-3 w-64 rounded">ฟอร์มสร้างใบเสนอราคา</button>

        <button onClick={() => router.push('/receipt')} className="bg-gray-200 px-6 py-3 w-64 rounded">ฟอร์มสร้างใบเสร็จ</button>

        <div className="flex justify-center space-x-4 pt-4">
          <button onClick={() => router.push('/history')} className="bg-gray-200 px-4 py-2 w-32 rounded">ประวัติ</button>
          <button onClick={() => router.push('/data/add')} className="bg-gray-200 px-4 py-2 w-32 rounded">เพิ่มข้อมูล</button>
        </div>
      </div>
    </div>
  );
}
