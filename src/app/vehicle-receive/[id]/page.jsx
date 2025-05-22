'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { PDFDownloadLink } from '@react-pdf/renderer';
import VehicleReceivePDF from '../../components/pdf/VehicleReceivePDF';



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
                                <VehicleReceivePDF
                                    form={content}
                                    services={services}
                                    brand={brand}
                                    model={model}
                                    warranty={warranty}
                                    docNumber={docNumber}
                                />
                            }
                            fileName={`ใบส่งรถ_${params.id}.pdf`}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            {({ loading }) => loading ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลดใบเสนอราคา'}
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
                            <h2 className="text-lg font-bold">ใบรับรถ</h2>
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
                        <p className="font-semibold text-sm">ลูกค้า Customer: {content.customerName || '-'}</p>
                        <p className="text-sm">เบอร์โทร Phone: {content.phone || '-'}</p>


                        {/* ✅ แสดงรายการบริการ */}
                        {services.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-semibold">บริการที่ทำ:</p>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    {services.map((service, index) => (
                                        <li key={index}>{service.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-medium text-sm mb-1">ข้อมูลรถ</h3>
                        <p className="text-sm">
                            ข้อมูลรถยนต์ : {brand?.name || '-'} {model?.name || '-'}
                        </p>
                        <p className="text-sm">เลขทะเบียน: {content.license || '-'} {content.province || '-'}</p>
                        {content.vin && <p className="text-sm">เลขตัวถัง (VIN) : {content.vin}</p>}
                        {content.year && <p className="text-sm">ปีรถ : {content.year}</p>}
                    </div>
                </div>
                <div className='px-6 py-4 text-sm leading-relaxed space-y-2'>
                    <h2 className="font-semibold mb-1 text-xl mb-4">เงื่อนไขการรับรถ Notice for vehicle received:</h2>
                    <p>- เอกสารฉบับนี้ออกให้ลูกค้าวัตถุประสงค์เพื่อเป็นหลักฐานว่า ลูกค้าได้นำรถมาจอดในพื้นที่ของบริษัทเพื่อรอรับบริการเท่านั้น <br />
                        this document is issued to the customer as evidence that customers had parking car in the company area
                        to wait in line for services.
                    </p>
                    <p> - ทางบริษัทไม่รับผิดชอบความสูญหายของทรัพย์สินภายในรถทุกกรณี เจ้าของรถต้องเก็บสิ่งของมีค่าออกจากรถให้เรียบร้อย <br />
                        The company is not responsible for the loss of property inside the vehicle in any case. Car owners must move
                        valuables from their vehicle.
                    </p>
                    <p>- บริษัทสามารถเคลื่อนย้ายจุดจอดให้เหมาะสมได้ ทั้งนี้บริษัทพยายามสุดความสามารถที่จะป้องกันรถของท่านจากการเฉี่ยวชนจากรถคันอื่น
                        หากเกิดเหตุการณ์ดังกล่าวขึ้น อู่สงวนสิทธิ์พิจารณาความเหมาะสมที่จะรับผิดชอบซ่อมแซม หรือปฏิเสธความรับผิดชอบ <br />
                        และให้ประกันภัยรถเป็นผู้รับผิดชอบ <br />
                        The Company can move the parking spot to suit. However, the company tries its best to protect your car from collisions
                        with other cars. if sush an event occurs The company reserves the right ti consider the appropriateness to be responsible
                        for repairs or deny responsibility and let the car insurance be responsible.
                    </p>
                </div>
            </div>
        </div>
    );
}