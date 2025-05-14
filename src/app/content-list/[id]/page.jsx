'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { fgetNextRunningNumber } from '../../utils/generateRunningNumber';

export default function ContentDetailPage() {
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState(null);
    const [services, setServices] = useState([]);
    const [brand, setBrand] = useState(null);
    const [model, setModel] = useState(null);
    const [warranty, setWarranty] = useState(null);
    const params = useParams();
    

    useEffect(() => {
        const fetchData = async () => {
            if (!params.id) return;

            setLoading(true);
            try {
                // Fetch the main document
                const docRef = doc(db, 'quotes', params.id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    console.error("Document not found");
                    setLoading(false);
                    return;
                }

                const data = docSnap.data();
                setContent(data);

                // Fetch brand data if available
                if (data.brand) {
                    const brandRef = doc(db, 'brands', data.brand);
                    const brandSnap = await getDoc(brandRef);
                    if (brandSnap.exists()) {
                        setBrand(brandSnap.data());
                    }
                }

                // Fetch model data if available
                if (data.brand && data.model) {
                    const modelRef = doc(db, 'brands', data.brand, 'models', data.model);
                    const modelSnap = await getDoc(modelRef);
                    if (modelSnap.exists()) {
                        setModel(modelSnap.data());
                    }
                }

                // Fetch warranty data if available
                if (data.warranty) {
                    const warrantyRef = doc(db, 'warrantyConditions', data.warranty);
                    const warrantySnap = await getDoc(warrantyRef);
                    if (warrantySnap.exists()) {
                        setWarranty(warrantySnap.data());
                    }
                }

                // Fetch service items
                const serviceItems = [];
                if (data.items && data.items.length > 0) {
                    for (const item of data.items) {
                        if (item.serviceId) {
                            const serviceRef = doc(db, 'services', item.serviceId);
                            const serviceSnap = await getDoc(serviceRef);
                            if (serviceSnap.exists()) {
                                const serviceData = serviceSnap.data();
                                serviceItems.push({
                                    ...item,
                                    name: serviceData.name,
                                    description: serviceData.description,
                                });
                            } else {
                                // Service not found, but still include it with basic info
                                serviceItems.push({
                                    ...item,
                                    name: 'บริการไม่พบในระบบ',
                                    description: '',
                                });
                            }
                        }
                    }
                }
                setServices(serviceItems);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

    // Calculate totals
    const calculateSubtotal = () => {
        return services.reduce((total, service) => {
            return total + (service.price || 0) * (service.quantity || 1);
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const discount = content?.discount || 0;
    const deposit = content?.deposit || 0;
    const grandTotal = subtotal - discount - deposit;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="mt-4 text-lg">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    <h2 className="text-xl font-bold">ไม่พบข้อมูล</h2>
                    <p className="mt-2">ไม่พบข้อมูลที่คุณกำลังค้นหา</p>
                    <Link href="/content-list" className="mt-4 inline-flex items-center text-blue-600 hover:underline">
                        <ArrowLeft className="w-4 h-4 mr-1" /> กลับไปยังรายการ
                    </Link>
                </div>
            </div>
        );
    }

    const docType = content.type === 'receipt' ? 'ใบเสร็จรับเงิน' : 'ใบเสนอราคา';
    const docNumber = content.documentNumber || `${content.type === 'receipt' ? 'R' : 'Q'}${params.id.substring(0, 6)}`;

    return (
        <div className="bg-gray-100 min-h-screen pb-10">
            {/* Action Bar - Hidden when printing */}
            <div className="bg-white shadow print:hidden">
                <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
                    <Link href="/content-list" className="inline-flex items-center text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5 mr-1" /> กลับไปยังรายการ
                    </Link>
                    <div className="flex space-x-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Printer className="w-4 h-4 mr-2" /> พิมพ์
                        </button>
                        <button className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                            <Download className="w-4 h-4 mr-2" /> บันทึก PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Content */}
            <div className="max-w-5xl mx-auto mt-6 bg-white shadow-md print:shadow-none">
                {/* Header Section */}
                <div className="border-b p-6 pb-4">
                    <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex items-start">
                            <div className="mr-4">
                                <img 
                                    src="/logo.png" 
                                    alt="ถึงแก่น อีลิท ชิลด์" 
                                    className="h-16 w-auto" 
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">บริษัท ถึงแก่น อีลิท ชิลด์ จำกัด</h1>
                                <h2 className="text-lg font-bold">THUENGKAEN CO.,LTD.</h2>
                                <p className="text-m text-gray-800 mt-1">
                                    149/1 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000
                                </p>
                                <p className="text-m text-gray-800">
                                    เบอร์โทร: 082-659-5365, 063-686-9999
                                </p>
                                <p className="text-m text-gray-800">
                                    เลขประจำตัวผู้เสียภาษีอากร: 0405566002141
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 text-right">
                            <h2 className="text-xl font-bold">{docType}</h2>
                            <p className="mt-1">เลขที่: {docNumber}</p>
                            <p>วันที่: {content.createdAt?.toDate().toLocaleDateString('th-TH') || new Date().toLocaleDateString('th-TH')}</p>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 border-b">
                    <div>
                        <h3 className="font-medium mb-2">ข้อมูลลูกค้า</h3>
                        <p className="font-semibold">{content.customerName || '-'}</p>
                        <p>เบอร์โทร : {content.phone || '-'}</p>
                        {content.customerAddress && <p className="text-gray-600">{content.customerAddress}</p>}
                    </div>
                    <div>
                        <h3 className="font-medium mb-2">ข้อมูลรถ</h3>
                        <p>
                            ข้อมูลรถยนต์ : {brand?.name || '-'} {model?.name || '-'}
                        </p>
                        <p>เลขทะเบียน: {content.license || '-'}</p>
                        {content.vin && <p>เลขตัวถัง (VIN) : {content.vin}</p>}
                    </div>
                </div>

                {/* Services Table */}
                <div className="p-6">
                    <h3 className="font-medium mb-3">รายการค่าบริการ</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border px-4 py-2 text-center w-16">ลำดับ</th>
                                    <th className="border px-4 py-2 text-left">รายละเอียด<br/>(Description)</th>
                                    <th className="border px-4 py-2 text-center w-20">จำนวน<br/>(Quantity)</th>
                                    <th className="border px-4 py-2 text-right w-32">ราคาต่อหน่วย</th>
                                    <th className="border px-4 py-2 text-right w-32">จำนวนเงิน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.length > 0 ? (
                                    services.map((service, index) => (
                                        <tr key={index}>
                                            <td className="border px-4 py-3 text-center">{index + 1}</td>
                                            <td className="border px-4 py-3">{service.name}</td>
                                            <td className="border px-4 py-3 text-center">{service.quantity || 1}</td>
                                            <td className="border px-4 py-3 text-right">{formatCurrency(service.price || 0)}</td>
                                            <td className="border px-4 py-3 text-right">
                                                {formatCurrency((service.price || 0) * (service.quantity || 1))}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="border px-4 py-3 text-center text-gray-500">
                                            ไม่มีรายการบริการ
                                        </td>
                                    </tr>
                                )}

                                {/* Empty rows to match the design */}
                                {Array.from({ length: Math.max(0, 10 - services.length) }).map((_, index) => (
                                    <tr key={`empty-${index}`}>
                                        <td className="border px-4 py-3">&nbsp;</td>
                                        <td className="border px-4 py-3"></td>
                                        <td className="border px-4 py-3"></td>
                                        <td className="border px-4 py-3"></td>
                                        <td className="border px-4 py-3"></td>
                                    </tr>
                                ))}

                                {/* Additional note row */}
                                <tr>
                                    <td className="border px-4 py-2 text-center font-medium">หมายเหตุ </td>
                                    <td colSpan="4" className="border px-4 py-2">
                                        {content.note}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="mt-4 flex flex-col md:flex-row">
                        {/* Warranty Terms */}
                        <div className="w-full md:w-2/3 pr-0 md:pr-4">
                            <div className="border p-4 h-full">
                                <h4 className="font-medium mb-2">เงื่อนไขการรับประกัน:</h4>
                                {warranty ? (
                                    <div className="text-sm">
                                        <p>{warranty.name}</p>
                                        <p>{warranty.description}</p>
                                        <p className='text-l'>ข้อยกเว้น</p> 
                                        <p>รถผู้ถือบัตรเกิดอุบัติทุกกรณี หรือ ความเสียหายที่เกิดจากความตั้งใจ ขูด, ขัด, กรีด, ลอก โดยบุคคลที่ไม่ใช่ช่างของศูนย์บริการ</p>
                                        <p>ช่องทางการชำระเงิน : ธนาคารกสิกรไทย เลขบัญชี 290-2-58522-5 ชื่อบัญชี กุลชรี</p>
                                    </div>
                                ) : (
                                    <div className="text-sm">
                                        <p>บริการทำสีกันรอยระยะเวลาภายใน 3 ปี maintenance ทุก 6 เดือน / เคลือบเงายาง 3 ปี</p>
                                        <p>ช่วงเวลา</p>
                                        <p>
                                            รับประกันเฉพาะชิ้นงานตามสภาพรถ หาก ความเสียหายเกิดจากอายุการใช้งาน, ชิ้น, ท่อ, สกรู
                                            โดยบุคคลที่ไม่ใช่ของบริษัทเรา
                                        </p>
                                        <p>ติดต่อฝ่ายช่างทาง - สาขาทวีผลขอนแก่น 290-2-58522-5</p>
                                        <p>หัวหน้าช่าง คุณศรี สาธนนท์</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Calculation */}
                        <div className="w-full md:w-1/3 mt-4 md:mt-0">
                            <table className="min-w-full border">
                                <tbody>
                                    <tr>
                                        <td className="border px-4 py-2 text-right font-medium">
                                            ยอดรวม<br/>TOTAL
                                        </td>
                                        <td className="border px-4 py-2 text-right font-medium">
                                            {formatCurrency(subtotal)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border px-4 py-2 text-right">
                                            ส่วนลด<br/>DISCOUNT
                                        </td>
                                        <td className="border px-4 py-2 text-right">
                                            {formatCurrency(discount)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border px-4 py-2 text-right">
                                            มัดจำจ่าย<br/>DEPOSIT
                                        </td>
                                        <td className="border px-4 py-2 text-right">
                                            {formatCurrency(deposit)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border px-4 py-2 text-right font-bold">
                                            ยอดรวมสุทธิ<br/>GRAND TOTAL
                                        </td>
                                        <td className="border px-4 py-2 text-right font-bold">
                                            {formatCurrency(grandTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="mt-8 grid grid-cols-3 gap-4">
                        <div className="border p-4 text-center">
                            <p className="mb-12">ลงนามลูกค้า</p>
                            <p className="border-t pt-2">วันที่</p>
                        </div>
                        <div className="border p-4 text-center">
                            <p className="mb-12">ผู้เสนอราคา</p>
                            <p className="border-t pt-2">วันที่</p>
                        </div>
                        <div className="border p-4 text-center">
                            <p className="mb-12">ในนาม บริษัท ถึงแก่น อีลิท ชิลด์ จำกัด</p>
                            <p className="border-t pt-2">ผู้มีอำนาจลงนาม</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}