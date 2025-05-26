'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { numberWithCommas } from '../../utils/number-format';
import { numberToThaiText } from '../../utils/numberToThaiText'; // ปรับ path ให้ตรง
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '../../components/pdf/InvoicePDF';



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
                    const warranties = [];

                    if (Array.isArray(data.warranty)) {
                        for (const id of data.warranty) {
                            const wSnap = await getDoc(doc(db, 'warrantyConditions', id));
                            if (wSnap.exists()) {
                                warranties.push({ id, ...wSnap.data() });
                            }
                        }
                    } else if (typeof data.warranty === 'string') {
                        const wSnap = await getDoc(doc(db, 'warrantyConditions', data.warranty));
                        if (wSnap.exists()) {
                            warranties.push({ id: data.warranty, ...wSnap.data() });
                        }
                    }

                    setWarranty(warranties); // ✅ เป็น array
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
                                    price: parseFloat(item.unitPrice) || 0,
                                    quantity: 1
                                });
                            } else {
                                // Service not found, but still include it with basic info
                                serviceItems.push({
                                    ...item,
                                    name: 'บริการไม่พบในระบบ',
                                    description: '',
                                    price: parseFloat(item.unitPrice) || 0,
                                    quantity: 1
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


    const discount = content?.discount ? parseFloat(content.discount) : 0;
    const totalPrice = content?.totalPrice ? parseFloat(content.totalPrice) : 0;
    const deposit = content?.deposit ? parseFloat(content.deposit) : 0;
    const grandTotal = totalPrice - discount - deposit;

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
    const docNumber = content.id_number || content.documentNumber || `${content.type === 'receipt' ? 'R' : 'Q'}${params.id.substring(0, 6)}`;

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
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                            <Printer className="w-4 h-4 mr-2" /> พิมพ์
                        </button>
                        <PDFDownloadLink
                            document={
                                <InvoicePDF
                                    form={content}
                                    services={services}
                                    grandTotal={grandTotal}
                                    brand={brand}
                                    model={model}
                                    warranty={warranty}
                                    deposit={deposit}
                                    discount={discount}
                                    totalPrice={totalPrice}
                                    docNumber={docNumber}
                                    remark={content.remark}
                                />
                            }
                            fileName={`ใบแจ้งหนี้_${params.id}.pdf`}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            {({ loading }) => (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    {loading ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลดใบแจ้งหนี้'}
                                </>
                            )}
                        </PDFDownloadLink>
                    </div>
                </div>
            </div>

            {/* Document Content - A4 size container */}
            <div id="pdf-content" className="max-w-[210mm] mx-auto mt-6 bg-white shadow-md print:shadow-none print:w-[210mm] print:mx-0 print:max-h-[297mm]">
                {/* Header Section */}
                <div className="border-b p-4">
                    <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex items-start">
                            <div className="mr-3">
                                <img
                                    src="/logo.png"
                                    alt="ถึงแก่น อีลิท ชิลด์"
                                    className="h-12 w-auto"
                                />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">บริษัท ถึงแก่น อีลิท ชิลด์ จำกัด</h1>
                                <h2 className="text-md font-bold">THUENGKAEN CO.,LTD.</h2>
                                <p className="text-xs text-gray-800">
                                    149/1 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000
                                </p>
                                <p className="text-xs text-gray-800">
                                    เบอร์โทร: 082-659-5365, 063-686-9999
                                </p>
                                <p className="text-xs text-gray-800">
                                    เลขประจำตัวผู้เสียภาษีอากร: 0405566002141
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 md:mt-0 text-right">
                            <h2 className="text-lg font-bold">ใบแจ้งหนี้</h2>
                            <p className="text-sm mt-1">เลขที่: {docNumber}</p>
                            <p className="text-sm">วันที่: {content.createdAt?.toDate ?
                                content.createdAt.toDate().toLocaleDateString('th-TH') :
                                new Date().toLocaleDateString('th-TH')}</p>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b">
                    <div>
                        <h3 className="font-medium text-sm mb-1">ข้อมูลลูกค้า</h3>
                        <p className="font-semibold text-sm">{content.customerName || '-'}</p>
                        <p className="text-sm">เบอร์โทร : {content.phone || '-'}</p>

                        {content.customerAddress && <p className="text-xs text-gray-600">{content.customerAddress}</p>}
                    </div>
                    <div>
                        <h3 className="font-medium text-sm mb-1">ข้อมูลรถ</h3>
                        <p className="text-sm">
                            ข้อมูลรถยนต์ : {brand?.name || '-'} {model?.name || '-'} | ปีรถ : {content.year}
                        </p>
                        <p className="text-sm">เลขทะเบียน: {content.license || '-'} {content.province || '-'}</p>
                        {content.vin && <p className="text-sm">เลขตัวถัง (VIN) : {content.vin}</p>}
                        {content.year && <p className="text-sm"></p>}
                    </div>
                </div>

                {/* Services Table */}
                <div className="p-4">
                    <h3 className="font-medium text-sm mb-2">รายการค่าบริการ</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border">
                            <thead >
                                <tr className="bg-gray-300">
                                    <th className="border px-2 py-1 text-center w-18 text-xs">ลำดับ</th>
                                    <th className="border px-2 py-1 text-left text-xs">รายละเอียด<br />(Description)</th>
                                    <th className="border px-2 py-1 text-center w-16 text-xs">จำนวน<br />(Quantity)</th>
                                    <th className="border px-2 py-1 text-right w-24 text-xs">ราคาต่อหน่วย</th>
                                    <th className="border px-2 py-1 text-right w-24 text-xs">จำนวนเงิน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.length > 0 ? (
                                    services.map((service, index) => (
                                        <tr key={index}>
                                            <td className="border px-2 py-1 text-center text-sm">{index + 1}</td>
                                            <td className="border px-2 py-1 text-sm">{service.name}</td>
                                            <td className="border px-2 py-1 text-center text-sm">{service.quantity || 1}</td>
                                            <td className="border px-2 py-1 text-right text-sm">{numberWithCommas(service.price || 0)}</td>
                                            <td className="border px-2 py-1 text-right text-sm">
                                                {numberWithCommas((service.price || 0) * (service.quantity || 1))}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="border px-2 py-1 text-center text-gray-500 text-sm">
                                            ไม่มีรายการบริการ
                                        </td>
                                    </tr>
                                )}

                                {/* Empty rows to match the design */}
                                {Array.from({ length: Math.max(0, 9 - services.length) }).map((_, index) => (
                                    <tr key={`empty-${index}`}>
                                        <td className="border px-2 py-1 text-sm">&nbsp;</td>
                                        <td className="border px-2 py-1"></td>
                                        <td className="border px-2 py-1"></td>
                                        <td className="border px-2 py-1"></td>
                                        <td className="border px-2 py-1"></td>
                                    </tr>
                                ))}

                                {/* Additional note row */}
                                <tr className='bg-gray-300'>
                                    <td className="border px-2 py-1 text-center font-medium text-sm ">ตัวอักษร</td>
                                    <td colSpan="4" className="border px-2 py-1 text-sm">
                                        ({numberToThaiText(grandTotal)})
                                    </td>
                                </tr>
                                <tr className='bg-gray-300'>
                                    <td className="border px-2 py-1 text-center font-medium text-sm ">หมายเหตุ</td>
                                    <td colSpan="4" className="border px-2 py-1 text-sm">
                                        {content.remark ||  "--ไม่มี--"} 
                                    </td>

                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="mt-3 flex flex-col md:flex-row">
                        {/* Warranty Terms */}
                        <div className="w-full md:w-2/3 pr-0 md:pr-3">
                            <div className="border p-3 h-full shadow-sm bg-gray-50">
                                <h4 className="font-medium text-sm mb-1">เงื่อนไขการรับประกัน</h4>

                                {Array.isArray(warranty) && warranty.length > 0 ? (
                                    <div className="text-xs space-y-1 text-gray-700">
                                        <p><strong>เงื่อนไข:</strong> {warranty.map(w => w.name).join(', ')}</p>

                                        <p className="font-semibold mt-1">ข้อยกเว้น:</p>
                                        <p className="pl-2">
                                            รถผู้ถือบัตรเกิดอุบัติเหตุทุกกรณี หรือ ความเสียหายที่เกิดจากความตั้งใจ เช่น ขูด, ขัด, กรีด, ลอก โดยบุคคลที่ไม่ใช่ช่างของศูนย์บริการ
                                        </p>

                                        <p className="font-semibold mt-1 text-sm">ช่องทางการชำระเงิน:</p>
                                        <p className="pl-2 text-sm font-light">
                                            ธนาคารกสิกรไทย เลขบัญชี 290-2-58522-5 ชื่อบัญชี กุลชรี
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 ">ไม่มีข้อมูลเงื่อนไขการรับประกัน</p>
                                )}

                            </div>

                        </div>

                        {/* Calculation */}
                        <div className="w-full md:w-1/3 mt-3 md:mt-0">
                            <table className="min-w-full border">
                                <tbody>
                                    <tr>
                                        <td className="border px-2 py-1 text-left font-light text-xs ">
                                            ยอดรวม<br />TOTAL
                                        </td>
                                        <td className="border px-2 py-1 text-right font-medium text-xs">
                                            {numberWithCommas(totalPrice)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border px-2 py-1 text-left text-xs">
                                            ส่วนลด<br />DISCOUNT
                                        </td>
                                        <td className="border px-2 py-1 text-right text-xs">
                                            {numberWithCommas(discount)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border px-2 py-1 text-left text-xs">
                                            มัดจำจ่าย<br />DEPOSIT
                                        </td>
                                        <td className="border px-2 py-1 text-right text-xs">
                                            {numberWithCommas(deposit)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border px-2 py-1 text-left font-lighttext-sm">
                                            ยอดรวมสุทธิ<br />GRAND TOTAL
                                        </td>
                                        <td className="border px-2 py-1 text-right font-bold text-sm">
                                            {numberWithCommas(grandTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="border p-2 text-center">
                            <p className="mb-8 text-xs text-left">ลงนามลูกค้า</p>
                            <p className="border-t pt-1 text-xs text-left">วันที่</p>
                        </div>
                        <div className="border p-2 text-center ">
                            <p className="mb-8 text-xs text-left">ลงนามพนักงาน</p>
                            <p className="border-t pt-1 text-xs text-left">วันที่</p>
                        </div>
                        <div className="border p-2 text-center">
                            <p className="mb-8 text-xs">ในนาม บริษัท ถึงแก่น อีลิท ชิลด์ จำกัด</p>
                            <p className="border-t pt-1 text-xs">ผู้มีอำนาจลงนาม</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}