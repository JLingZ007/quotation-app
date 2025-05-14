'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Search, Filter, Loader2, FileText, Receipt, ChevronDown, ChevronUp } from 'lucide-react';

export default function ContentListPage() {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortField, setSortField] = useState('customerName');
    const [sortDirection, setSortDirection] = useState('asc');
    const router = useRouter();

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, 'quotes'));

                const dataWithNames = await Promise.all(
                    snapshot.docs.map(async (docSnap) => {
                        const data = docSnap.data();

                        // — ดึงชื่อ brand
                        let brandName = '-';
                        if (data.brand) {
                            const bSnap = await getDoc(doc(db, 'brands', data.brand));
                            if (bSnap.exists()) brandName = bSnap.data().name;
                        }

                        // — ดึงชื่อ model
                        let modelName = '-';
                        if (data.brand && data.model) {
                            const mSnap = await getDoc(doc(db, 'brands', data.brand, 'models', data.model));
                            if (mSnap.exists()) modelName = mSnap.data().name;
                        }

                        // — ดึงชื่อ service (รองรับ array)
                        let serviceNames = [];
                        if (data.items && data.items.length > 0) {
                            for (let item of data.items) {
                                const sSnap = await getDoc(doc(db, 'services', item.serviceId));
                                if (sSnap.exists()) serviceNames.push(sSnap.data().name);
                            }
                        }

                        // — ดึงชื่อ warranty
                        let warrantyName = '-';
                        if (data.warranty) {
                            const wSnap = await getDoc(doc(db, 'warrantyConditions', data.warranty));
                            if (wSnap.exists()) warrantyName = wSnap.data().name;
                        }

                        return {
                            id: docSnap.id,
                            type: data.type,
                            customerName: data.customerName,
                            brandName,
                            modelName,
                            serviceNames,  // เป็น Array ของชื่อ service
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
                record.serviceNames.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
            
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

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-2xl font-bold mb-4 md:mb-0">รายการทั้งหมด</h1>
                
                <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                    {/* Search input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    </div>
                    
                    {/* Type filter */}
                    <div className="relative">
                        <select
                            className="pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white w-full md:w-48"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="quote">ใบเสนอราคา</option>
                            <option value="receipt">ใบเสร็จ</option>
                        </select>
                        <Filter className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                        <ChevronDown className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-lg">กำลังโหลดข้อมูล...</span>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">ไม่พบข้อมูลที่ค้นหา</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('type')}
                                >
                                    ประเภท {renderSortIcon('type')}
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('customerName')}
                                >
                                    ชื่อลูกค้า {renderSortIcon('customerName')}
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('brandName')}
                                >
                                    รถ {renderSortIcon('brandName')}
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('serviceNames')}
                                >
                                    บริการ {renderSortIcon('serviceNames')}
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('warrantyName')}
                                >
                                    เงื่อนไขรับประกัน {renderSortIcon('warrantyName')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRecords.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 transition cursor-pointer"
                                    onClick={() => router.push(`/content-list/${item.id}`)}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {getTypeIcon(item.type)}
                                            <span className={`text-sm ${item.type === 'receipt' ? 'text-green-600' : 'text-blue-600'}`}>
                                                {getTypeLabel(item.type)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="font-medium">{item.customerName || '-'}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {item.brandName} {item.modelName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                            {item.serviceNames.length > 0 
                                                ? item.serviceNames.join(', ') 
                                                : '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {item.warrantyName}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500 text-right">
                แสดง {filteredRecords.length} รายการ จากทั้งหมด {records.length} รายการ
            </div>
        </div>
    );
}