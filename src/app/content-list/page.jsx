'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, Filter, Loader2, FileText, Receipt,
    ChevronDown, ChevronUp, ArrowLeft, Calendar, MapPin, Pencil, ArrowRight
} from 'lucide-react';

export default function ContentListPage() {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const router = useRouter();

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, 'quotes'));

                const dataWithNames = await Promise.all(
                    snapshot.docs.map(async (docSnap) => {
                        const data = docSnap.data();

                        // ดึงชื่อ brand
                        let brandName = '-';
                        if (data.brand) {
                            const bSnap = await getDoc(doc(db, 'brands', data.brand));
                            if (bSnap.exists()) brandName = bSnap.data().name;
                        }

                        // ดึงชื่อ model
                        let modelName = '-';
                        if (data.brand && data.model) {
                            const mSnap = await getDoc(doc(db, 'brands', data.brand, 'models', data.model));
                            if (mSnap.exists()) modelName = mSnap.data().name;
                        }

                        // ดึงชื่อ service (รองรับ array)
                        let serviceNames = [];
                        if (data.items && data.items.length > 0) {
                            for (let item of data.items) {
                                const sSnap = await getDoc(doc(db, 'services', item.serviceId));
                                if (sSnap.exists()) serviceNames.push(sSnap.data().name);
                            }
                        }

                        // ดึงชื่อ warranty
                        let warrantyName = '-';

                        if (Array.isArray(data.warranty)) {
                            const names = [];
                            for (const id of data.warranty) {
                                const wSnap = await getDoc(doc(db, 'warrantyConditions', id));
                                if (wSnap.exists()) names.push(wSnap.data().name);
                            }
                            warrantyName = names.join(', ');
                        } else if (typeof data.warranty === 'string') {
                            const wSnap = await getDoc(doc(db, 'warrantyConditions', data.warranty));
                            if (wSnap.exists()) warrantyName = wSnap.data().name;
                        }

                        return {
                            id: docSnap.id,
                            type: data.type,
                            customerName: data.customerName,
                            brandName,
                            modelName,
                            serviceNames,
                            license: data.license || '-',
                            province: data.province || '-',
                            warrantyName,
                            createdAt: data.createdAt?.toDate() || new Date(),
                        };
                    })
                );

                setRecords(dataWithNames);
                setFilteredRecords(dataWithNames);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    useEffect(() => {
        // Filter records based on search term and type filter
        const filtered = records.filter(record => {
            const matchesSearch =
                record.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.serviceNames.some(service => service.toLowerCase().includes(searchTerm.toLowerCase())) ||
                record.license?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === 'all' || record.type === typeFilter;

            return matchesSearch && matchesType;
        });

        // Sort filtered records
        const sorted = [...filtered].sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            // Handle special sorting cases
            if (sortField === 'serviceNames') {
                valueA = valueA.join(', ');
                valueB = valueB.join(', ');
            }

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortDirection === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            // For dates and numbers
            return sortDirection === 'asc'
                ? valueA - valueB
                : valueB - valueA;
        });

        setFilteredRecords(sorted);
    }, [records, searchTerm, typeFilter, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />;
    };

    const getTypeLabel = (type) => {
        return type === 'receipt' ? 'ใบเสร็จ' : 'ใบเสนอราคา';
    };

    const getTypeIcon = (type) => {
        return type === 'receipt'
            ? <Receipt className="w-4 h-4 mr-1 text-green-600" />
            : <FileText className="w-4 h-4 mr-1 text-blue-600" />;
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {/* Header section */}
                <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div className="flex flex-col mb-4 md:mb-0">
                            <h1 className="text-2xl font-bold text-gray-800">รายการทั้งหมด</h1>
                            <p className="text-gray-500 mt-1">ระบบบริหารจัดการใบเสนอราคาและใบเสร็จ</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Link href="/form" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                                <ArrowRight className="w-5 h-5 mr-1" /> ไปยังหน้าสร้างรายการ
                            </Link>
                            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                                <ArrowLeft className="w-5 h-5 mr-1" /> กลับไปยังหน้าแรก
                            </Link>
                        </div>
                    </div>

                    {/* Search and filter section */}
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search input */}
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="ค้นหาลูกค้า, รถ, บริการ, ทะเบียน..."
                                className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        </div>

                        {/* Type filter */}
                        <div className="relative md:w-64">
                            <select
                                className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg appearance-none bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">ทั้งหมด</option>
                                <option value="quote">ใบเสนอราคา</option>
                                <option value="receipt">ใบเสร็จ</option>
                            </select>
                            <Filter className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <ChevronDown className="absolute right-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Content section */}
                {loading ? (
                    <div className="flex justify-center items-center py-16 bg-white rounded-lg shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-lg font-medium text-gray-700">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                        <div className="inline-flex justify-center items-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg font-medium">ไม่พบข้อมูลที่ค้นหา</p>
                        <p className="text-gray-400 mt-2">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-hidden bg-white rounded-lg shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th
                                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('type')}
                                            >
                                                <div className="flex items-center">
                                                    <span>ประเภท</span>
                                                    {renderSortIcon('type')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('createdAt')}
                                            >
                                                <div className="flex items-center">
                                                    <span>วันที่</span>
                                                    {renderSortIcon('createdAt')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('customerName')}
                                            >
                                                <div className="flex items-center">
                                                    <span>ชื่อลูกค้า</span>
                                                    {renderSortIcon('customerName')}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('brandName')}
                                            >
                                                <div className="flex items-center">
                                                    <span>รถ</span>
                                                    {renderSortIcon('brandName')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <span>ทะเบียน</span>
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('serviceNames')}
                                            >
                                                <div className="flex items-center">
                                                    <span>บริการ</span>
                                                    {renderSortIcon('serviceNames')}
                                                </div>
                                            </th>
                                            
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <span>พิมพ์</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center ">
                                                    <span>แก้ไข</span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredRecords.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-blue-50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                                                        ${item.type === 'receipt' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-blue-100 text-blue-800'}"
                                                    >
                                                        {getTypeIcon(item.type)}
                                                        {getTypeLabel(item.type)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm flex items-center text-gray-700">
                                                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                                        {formatDate(item.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{item.customerName || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {item.brandName !== '-' && item.modelName !== '-' ? (
                                                            <>
                                                                <span className="font-medium">{item.brandName}</span>
                                                                <span className="text-gray-600"> {item.modelName}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm flex items-center">
                                                        {item.license !== '-' ? (
                                                            <>
                                                                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                                                <span className="font-medium">{item.license}</span>
                                                                <span className="text-gray-500 ml-1">{item.province}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                                        {item.serviceNames.length > 0 ? (
                                                            <span className="line-clamp-2">{item.serviceNames.join(', ')}</span>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-4 whitespace-nowrap space-x-2 text-sm">
                                                    <div className="flex space-x-2 ">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/quotation/${item.id}`);
                                                            }}
                                                            className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors flex items-center cursor-pointer"
                                                        >
                                                            <FileText className="w-3.5 h-3.5 mr-1" />
                                                            ใบเสนอราคา
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/receipt/${item.id}`);
                                                            }}
                                                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md transition-colors flex items-center cursor-pointer"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5 mr-1" />
                                                            ใบเสร็จ
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/invoice/${item.id}`);
                                                            }}
                                                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors flex items-center cursor-pointer"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5 mr-1" />
                                                            ใบแจ้งหนี้
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/vehicle-receive/${item.id}`);
                                                            }}
                                                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors flex items-center cursor-pointer"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5 mr-1" />
                                                            ใบรับรถ
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap ">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/editForm/${item.id}`);
                                                        }}
                                                        className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors flex items-center text-sm cursor-pointer"
                                                    >
                                                        <Pencil className="w-4 h-4 mr-1 " />
                                                        แก้ไข
                                                    </button>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-600 text-right bg-white p-4 rounded-lg shadow-sm">
                            กำลังแสดง <span className="font-medium">{filteredRecords.length}</span> รายการ จากทั้งหมด <span className="font-medium">{records.length}</span> รายการ
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}