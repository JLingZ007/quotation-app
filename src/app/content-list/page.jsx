'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNextRunningNumber } from '../utils/generateRunningNumber';
import {
    Search, Filter, Loader2, FileText, Receipt,
    ChevronDown, ChevronUp, ArrowLeft, Calendar, MapPin, Pencil, ArrowRight, Copy
} from 'lucide-react';

export default function ContentListPage() {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [displayedRecords, setDisplayedRecords] = useState([]); // Records ที่แสดงในตาราง
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false); // Loading สำหรับโหลดข้อมูลเพิ่ม
    const [duplicating, setDuplicating] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [warrantyFilter, setWarrantyFilter] = useState('all');
    const [warrantyOptions, setWarrantyOptions] = useState([]);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    
    // Infinite scroll settings
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20); // จำนวนรายการต่อหน้า
    const [hasMore, setHasMore] = useState(true);
    
    const tableRef = useRef(null);
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

                        // ดึงชื่อ warranty และเก็บ ID ไว้ด้วย
                        let warrantyName = '-';
                        let warrantyIds = data.warranty;

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
                            warranty: warrantyIds,
                            warrantyName,
                            createdAt: data.createdAt?.toDate() || new Date(),
                            originalData: data
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

    // เพิ่ม useEffect สำหรับดึง warranty options
    useEffect(() => {
        const fetchWarrantyOptions = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'warrantyConditions'));
                const options = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setWarrantyOptions(options);
            } catch (error) {
                console.error("Error fetching warranty options:", error);
            }
        };

        fetchWarrantyOptions();
    }, []);

    // Function สำหรับ duplicate ข้อมูล
    const handleDuplicate = async (recordId) => {
        setDuplicating(recordId);
        try {
            const recordToDuplicate = records.find(r => r.id === recordId);
            if (!recordToDuplicate) {
                alert('ไม่พบข้อมูลที่จะคัดลอก');
                return;
            }

            const id_number = await getNextRunningNumber();

            const duplicatedData = {
                ...recordToDuplicate.originalData,
                id_number,
                runningNumber: id_number,
                createdAt: serverTimestamp(),
                customerName: `[คัดลอก] ${recordToDuplicate.originalData.customerName || 'ไม่ระบุชื่อ'}`
            };

            const docRef = await addDoc(collection(db, 'quotes'), duplicatedData);
            alert(`คัดลอกข้อมูลเรียบร้อยแล้ว\nหมายเลขใหม่: ${id_number}`);
            window.location.reload();

        } catch (error) {
            console.error("Error duplicating record:", error);
            alert('เกิดข้อผิดพลาดในการคัดลอกข้อมูล');
        } finally {
            setDuplicating(null);
        }
    };

    // Filter และ sort records
    useEffect(() => {
        const filtered = records.filter(record => {
            const matchesSearch =
                record.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.serviceNames.some(service => service.toLowerCase().includes(searchTerm.toLowerCase())) ||
                record.license?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesWarranty = warrantyFilter === 'all' ||
                (record.warranty && (
                    (Array.isArray(record.warranty) && record.warranty.includes(warrantyFilter)) ||
                    (typeof record.warranty === 'string' && record.warranty === warrantyFilter)
                ));

            return matchesSearch && matchesWarranty;
        });

        const sorted = [...filtered].sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            if (sortField === 'serviceNames') {
                valueA = valueA.join(', ');
                valueB = valueB.join(', ');
            }

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortDirection === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            return sortDirection === 'asc'
                ? valueA - valueB
                : valueB - valueA;
        });

        setFilteredRecords(sorted);
        setCurrentPage(1); // รีเซ็ตหน้าเมื่อมีการกรองใหม่
        setHasMore(true);
    }, [records, searchTerm, warrantyFilter, sortField, sortDirection]);

    // จัดการข้อมูลที่แสดงในตาราง (Pagination)
    useEffect(() => {
        const startIndex = 0;
        const endIndex = currentPage * itemsPerPage;
        const newDisplayedRecords = filteredRecords.slice(startIndex, endIndex);
        
        setDisplayedRecords(newDisplayedRecords);
        setHasMore(endIndex < filteredRecords.length);
    }, [filteredRecords, currentPage, itemsPerPage]);

    // Function สำหรับโหลดข้อมูลเพิ่ม
    const loadMoreRecords = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        
        setLoadingMore(true);
        
        // จำลองการโหลดข้อมูล (ในกรณีจริงอาจมี delay จาก API)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCurrentPage(prev => prev + 1);
        setLoadingMore(false);
    }, [loadingMore, hasMore]);

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        if (!tableRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        
        // เมื่อเลื่อนถึง 80% ของความสูงให้โหลดข้อมูลเพิ่ม
        if (scrollPercentage > 0.8 && hasMore && !loadingMore) {
            loadMoreRecords();
        }
    }, [hasMore, loadingMore, loadMoreRecords]);

    // เพิ่ม scroll event listener
    useEffect(() => {
        const tableElement = tableRef.current;
        if (tableElement) {
            tableElement.addEventListener('scroll', handleScroll);
            return () => tableElement.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

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

                        <div className="relative md:w-64">
                            <select
                                className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg appearance-none bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={warrantyFilter}
                                onChange={(e) => setWarrantyFilter(e.target.value)}
                            >
                                <option value="all">เงื่อนไขรับประกันทั้งหมด</option>
                                {warrantyOptions.map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
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
                            {/* Table container with fixed height and scroll */}
                            <div 
                                ref={tableRef}
                                className="overflow-auto"
                                style={{ 
                                    maxHeight: '70vh', // จำกัดความสูงของตาราง
                                    scrollBehavior: 'smooth' 
                                }}
                            >
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
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
                                                <div className="flex items-center">
                                                    <span>จัดการ</span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {displayedRecords.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-blue-50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        item.type === 'receipt' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
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
                                                    <div className="flex flex-wrap gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/quotation/${item.id}`);
                                                            }}
                                                            className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors flex items-center cursor-pointer text-xs"
                                                        >
                                                            <FileText className="w-3 h-3 mr-1" />
                                                            ใบเสนอราคา
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/receipt/${item.id}`);
                                                            }}
                                                            className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md transition-colors flex items-center cursor-pointer text-xs"
                                                        >
                                                            <Receipt className="w-3 h-3 mr-1" />
                                                            ใบเสร็จ
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/invoice/${item.id}`);
                                                            }}
                                                            className="px-2 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors flex items-center cursor-pointer text-xs"
                                                        >
                                                            <Receipt className="w-3 h-3 mr-1" />
                                                            ใบแจ้งหนี้
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/vehicle-receive/${item.id}`);
                                                            }}
                                                            className="px-2 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors flex items-center cursor-pointer text-xs"
                                                        >
                                                            <Receipt className="w-3 h-3 mr-1" />
                                                            ใบรับรถ
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/editForm/${item.id}`);
                                                            }}
                                                            className="px-2 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors flex items-center text-xs cursor-pointer"
                                                        >
                                                            <Pencil className="w-3 h-3 mr-1" />
                                                            แก้ไข
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('คุณต้องการคัดลอกข้อมูลนี้หรือไม่?')) {
                                                                    handleDuplicate(item.id);
                                                                }
                                                            }}
                                                            disabled={duplicating === item.id}
                                                            className={`px-2 py-1 rounded-md transition-colors flex items-center text-xs cursor-pointer ${
                                                                duplicating === item.id
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                            }`}
                                                        >
                                                            {duplicating === item.id ? (
                                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <Copy className="w-3 h-3 mr-1" />
                                                            )}
                                                            {duplicating === item.id ? 'กำลังคัดลอก...' : 'คัดลอก'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        
                                        {/* Loading row สำหรับ infinite scroll */}
                                        {loadingMore && (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-8 text-center">
                                                    <div className="flex justify-center items-center">
                                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                                                        <span className="text-gray-600">กำลังโหลดข้อมูลเพิ่มเติม...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        
                                        {/* End of data indicator */}
                                        {!hasMore && displayedRecords.length > 0 && (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-2 text-center">
                                                    <div className="text-gray-500 text-sm  pt-4">
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-gray-300 rounded-full mx-1"></div>
                                                            <div className="w-2 h-2 bg-gray-300 rounded-full mx-1"></div>
                                                            <div className="w-2 h-2 bg-gray-300 rounded-full mx-1"></div>
                                                        </div>
                                                        <p className="mt-2">แสดงข้อมูลครบทั้งหมดแล้ว</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Status bar with scroll indicator */}
                        <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                <div className="text-sm text-gray-600">
                                    แสดง <span className="font-medium text-blue-600">{displayedRecords.length}</span> รายการ จากทั้งหมด <span className="font-medium text-blue-600">{filteredRecords.length}</span> รายการ
                                    {filteredRecords.length !== records.length && (
                                        <span className="text-gray-500"> (กรองจากทั้งหมด {records.length} รายการ)</span>
                                    )}
                                </div>
                                
                                {/* Progress indicator */}
                                {filteredRecords.length > itemsPerPage && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min((displayedRecords.length / filteredRecords.length) * 100, 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {Math.round((displayedRecords.length / filteredRecords.length) * 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Scroll hint */}
                            {hasMore && displayedRecords.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500 flex items-center justify-center">
                                    <ChevronDown className="w-4 h-4 mr-1 animate-bounce" />
                                    เลื่อนลงเพื่อดูข้อมูลเพิ่มเติม
                                </div>
                            )}
                        </div>

                        {/* Load more button (alternative to infinite scroll) */}
                        {hasMore && displayedRecords.length > 0 && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={loadMoreRecords}
                                    disabled={loadingMore}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                        loadingMore
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5'
                                    }`}
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                                            กำลังโหลด...
                                        </>
                                    ) : (
                                        <>
                                            โหลดข้อมูลเพิ่มเติม ({filteredRecords.length - displayedRecords.length} รายการ)
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}