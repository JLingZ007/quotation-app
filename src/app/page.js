'use client'
import { useRouter } from 'next/navigation';
import { FileText, Receipt, History, List, PlusCircle, Car, Shield } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        {/* Logo and Header Section */}
        <div className="flex flex-col items-center mb-8">
          <img src = "./logo.png" />
          
          <p className="text-gray-600 mt-2">ระบบจัดการใบเสนอราคาและใบเสร็จ</p>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-4 mb-8">
          <button 
            onClick={() => router.push('/form')} 
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 w-full rounded-lg transition shadow-md group"
          >
            <FileText className="w-5 h-5 mr-3 group-hover:animate-pulse" />
            <span>สร้างใบเสนอราคา</span>
          </button>

          {/* <button 
            onClick={() => router.push('/receipt')} 
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-4 w-full rounded-lg transition shadow-md group"
          >
            <Receipt className="w-5 h-5 mr-3 group-hover:animate-pulse" />
            <span>สร้างใบเสร็จ</span>
          </button> */}
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          {/* <button 
            onClick={() => router.push('/history')} 
            className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 px-4 py-4 rounded-lg transition text-gray-700 hover:text-blue-700"
          >
            <History className="w-6 h-6 mb-2" />
            <span className="text-sm">ประวัติ</span>
          </button> */}
          
          <button 
            onClick={() => router.push('/content-list')} 
            className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 px-4 py-4 rounded-lg transition text-gray-700 hover:text-blue-700"
          >
            <List className="w-6 h-6 mb-2" />
            <span className="text-sm">รายการทั้งหมด</span>
          </button>
          
          <button 
            onClick={() => router.push('/create/add')} 
            className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 px-4 py-4 rounded-lg transition text-gray-700 hover:text-blue-700"
          >
            <PlusCircle className="w-6 h-6 mb-2" />
            <span className="text-sm">เพิ่มข้อมูล</span>
          </button>
        </div>

        
      </div>
    </div>
  );
}