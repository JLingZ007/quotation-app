'use client';
import { useEffect, useState } from 'react';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    query,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

import { 
    PlusCircle, 
    Save, 
    ChevronDown, 
    Car, 
    Shield, 
    Wrench, 
    FileText,
    ArrowLeft 
} from 'lucide-react';

export default function AddDataPage() {
    // State for data lists
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [warrantyList, setWarrantyList] = useState([]);
    const [serviceList, setServiceList] = useState([]);

    // State for selections
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedWarranty, setSelectedWarranty] = useState('');
    const [selectedService, setSelectedService] = useState('');

    // State for adding new items
    const [newBrand, setNewBrand] = useState('');
    const [newModel, setNewModel] = useState('');
    const [newWarranty, setNewWarranty] = useState('');
    const [newService, setNewService] = useState('');

    // State for form modal controls
    const [showBrandForm, setShowBrandForm] = useState(false);
    const [showModelForm, setShowModelForm] = useState(false);
    const [showWarrantyForm, setShowWarrantyForm] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);
    
    // State for form submission and feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitFeedback, setSubmitFeedback] = useState({ show: false, message: '', type: '' });

    // Load brands, warranty conditions, and services from Firestore
    useEffect(() => {
        const fetchData = async () => {
            try {
                const brandSnapshot = await getDocs(collection(db, 'brands'));
                const warrantySnapshot = await getDocs(collection(db, 'warrantyConditions'));
                const serviceSnapshot = await getDocs(collection(db, 'services'));

                setBrands(brandSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setWarrantyList(warrantySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setServiceList(serviceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching data:", error);
                showFeedback("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
            }
        };
        fetchData();
    }, []);

    // Load models based on selected brand
    useEffect(() => {
        const fetchModels = async () => {
            if (!selectedBrand) {
                setModels([]);
                setSelectedModel('');
                return;
            }
            try {
                const modelSnapshot = await getDocs(collection(db, 'brands', selectedBrand, 'models'));
                setModels(modelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching models:", error);
                showFeedback("ไม่สามารถโหลดข้อมูลรุ่นรถได้", "error");
            }
        };
        fetchModels();
    }, [selectedBrand]);

    // Show feedback message
    const showFeedback = (message, type = 'success') => {
        setSubmitFeedback({ show: true, message, type });
        setTimeout(() => {
            setSubmitFeedback({ show: false, message: '', type: '' });
        }, 3000);
    };

    // Add new brand
    const handleAddBrand = async (e) => {
        e.preventDefault();
        if (!newBrand.trim()) return;
        
        try {
            const docRef = await addDoc(collection(db, 'brands'), { name: newBrand.trim() });
            setBrands([...brands, { id: docRef.id, name: newBrand.trim() }]);
            setNewBrand('');
            setShowBrandForm(false);
            showFeedback("เพิ่มยี่ห้อรถสำเร็จ");
        } catch (error) {
            console.error("Error adding brand:", error);
            showFeedback("ไม่สามารถเพิ่มยี่ห้อรถได้", "error");
        }
    };

    // Add new model
    const handleAddModel = async (e) => {
        e.preventDefault();
        if (!selectedBrand || !newModel.trim()) return;
        
        try {
            const docRef = doc(collection(db, 'brands', selectedBrand, 'models'));
            await setDoc(docRef, { name: newModel.trim() });
            setModels([...models, { id: docRef.id, name: newModel.trim() }]);
            setNewModel('');
            setShowModelForm(false);
            showFeedback("เพิ่มรุ่นรถสำเร็จ");
        } catch (error) {
            console.error("Error adding model:", error);
            showFeedback("ไม่สามารถเพิ่มรุ่นรถได้", "error");
        }
    };

    // Add new warranty condition
    const handleAddWarranty = async (e) => {
        e.preventDefault();
        if (!newWarranty.trim()) return;
        
        try {
            const docRef = await addDoc(collection(db, 'warrantyConditions'), { name: newWarranty.trim() });
            setWarrantyList([...warrantyList, { id: docRef.id, name: newWarranty.trim() }]);
            setNewWarranty('');
            setShowWarrantyForm(false);
            showFeedback("เพิ่มเงื่อนไขการรับประกันสำเร็จ");
        } catch (error) {
            console.error("Error adding warranty:", error);
            showFeedback("ไม่สามารถเพิ่มเงื่อนไขการรับประกันได้", "error");
        }
    };

    // Add new service
    const handleAddService = async (e) => {
        e.preventDefault();
        if (!newService.trim()) return;
        
        try {
            const docRef = await addDoc(collection(db, 'services'), { name: newService.trim() });
            setServiceList([...serviceList, { id: docRef.id, name: newService.trim() }]);
            setNewService('');
            setShowServiceForm(false);
            showFeedback("เพิ่มบริการสำเร็จ");
        } catch (error) {
            console.error("Error adding service:", error);
            showFeedback("ไม่สามารถเพิ่มบริการได้", "error");
        }
    };

    // Submit form data
    const handleSubmit = async () => {
        if (!selectedBrand || !selectedModel || !selectedWarranty || !selectedService) {
            return showFeedback("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
        }
        
        setIsSubmitting(true);
        
        try {
            const quoteData = {
                brand: selectedBrand,
                model: selectedModel,
                warranty: selectedWarranty,
                service: selectedService,
                created: new Date(),
            };

            await addDoc(collection(db, 'quotes'), quoteData);
            showFeedback("บันทึกข้อมูลสำเร็จ");
            
            // Reset form
            setSelectedBrand('');
            setSelectedModel('');
            setSelectedWarranty('');
            setSelectedService('');
        } catch (error) {
            console.error("Error submitting data:", error);
            showFeedback("ไม่สามารถบันทึกข้อมูลได้", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render input form for adding new items
    const renderFormModal = (title, value, setValue, submitHandler, isOpen, setIsOpen) => {
        if (!isOpen) return null;
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-medium mb-4">{title}</h3>
                    <form onSubmit={submitHandler}>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="กรอกข้อมูล"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                บันทึก
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                    <FileText className="h-6 w-6 text-blue-600 mr-2" />
                    <h1 className="text-2xl font-bold text-gray-800">เพิ่มข้อมูลระบบ</h1>
                </div>

                {/* Feedback message */}
                {submitFeedback.show && (
                    <div className={`mb-4 p-3 rounded ${
                        submitFeedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                        {submitFeedback.message}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {/* Brand selection */}
                    <div className="relative">
                        <div className="flex items-center mb-2">
                            <Car className="h-4 w-4 text-gray-600 mr-1" />
                            <label className="font-medium text-gray-700">ยี่ห้อรถ</label>
                        </div>
                        <div className="flex">
                            <div className="relative flex-1">
                                <select 
                                    className="w-full p-3 pr-10 bg-white border border-gray-300 rounded text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedBrand} 
                                    onChange={e => setSelectedBrand(e.target.value)}
                                >
                                    <option value="">-- เลือกยี่ห้อรถ --</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowBrandForm(true)}
                                className="ml-2 flex items-center justify-center p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 focus:outline-none"
                                title="เพิ่มยี่ห้อใหม่"
                            >
                                <PlusCircle className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Model selection */}
                    <div className="relative">
                        <div className="flex items-center mb-2">
                            <Car className="h-4 w-4 text-gray-600 mr-1" />
                            <label className="font-medium text-gray-700">รุ่นรถ</label>
                        </div>
                        <div className="flex">
                            <div className="relative flex-1">
                                <select 
                                    className="w-full p-3 pr-10 bg-white border border-gray-300 rounded text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedModel} 
                                    onChange={e => setSelectedModel(e.target.value)}
                                    disabled={!selectedBrand}
                                >
                                    <option value="">-- เลือกรุ่นรถ --</option>
                                    {models.map(model => (
                                        <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowModelForm(true)}
                                className="ml-2 flex items-center justify-center p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 focus:outline-none"
                                disabled={!selectedBrand}
                                title="เพิ่มรุ่นใหม่"
                            >
                                <PlusCircle className="h-5 w-5" />
                            </button>
                        </div>
                        {!selectedBrand && (
                            <p className="mt-1 text-sm text-gray-500">โปรดเลือกยี่ห้อรถก่อน</p>
                        )}
                    </div>

                    {/* Warranty selection */}
                    <div className="relative">
                        <div className="flex items-center mb-2">
                            <Shield className="h-4 w-4 text-gray-600 mr-1" />
                            <label className="font-medium text-gray-700">เงื่อนไขการรับประกัน</label>
                        </div>
                        <div className="flex">
                            <div className="relative flex-1">
                                <select 
                                    className="w-full p-3 pr-10 bg-white border border-gray-300 rounded text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedWarranty} 
                                    onChange={e => setSelectedWarranty(e.target.value)}
                                >
                                    <option value="">-- เลือกเงื่อนไขการรับประกัน --</option>
                                    {warrantyList.map(warranty => (
                                        <option key={warranty.id} value={warranty.id}>{warranty.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowWarrantyForm(true)}
                                className="ml-2 flex items-center justify-center p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 focus:outline-none"
                                title="เพิ่มเงื่อนไขใหม่"
                            >
                                <PlusCircle className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Service selection */}
                    <div className="relative">
                        <div className="flex items-center mb-2">
                            <Wrench className="h-4 w-4 text-gray-600 mr-1" />
                            <label className="font-medium text-gray-700">รายการบริการ</label>
                        </div>
                        <div className="flex">
                            <div className="relative flex-1">
                                <select 
                                    className="w-full p-3 pr-10 bg-white border border-gray-300 rounded text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedService} 
                                    onChange={e => setSelectedService(e.target.value)}
                                >
                                    <option value="">-- เลือกรายการบริการ --</option>
                                    {serviceList.map(service => (
                                        <option key={service.id} value={service.id}>{service.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowServiceForm(true)}
                                className="ml-2 flex items-center justify-center p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 focus:outline-none"
                                title="เพิ่มบริการใหม่"
                            >
                                <PlusCircle className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* back */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <button >
                            <Link href="/" className="mt-4 inline-flex items-center text-blue-600 hover:underline">
                                <ArrowLeft className="w-4 h-4 mr-1" /> กลับไปยังหน้าหลัก
                            </Link>
                        </button>
                    </div>
                </div>

                {/* Modal forms for adding new items */}
                {renderFormModal("เพิ่มยี่ห้อรถใหม่", newBrand, setNewBrand, handleAddBrand, showBrandForm, setShowBrandForm)}
                {renderFormModal("เพิ่มรุ่นรถใหม่", newModel, setNewModel, handleAddModel, showModelForm, setShowModelForm)}
                {renderFormModal("เพิ่มเงื่อนไขการรับประกัน", newWarranty, setNewWarranty, handleAddWarranty, showWarrantyForm, setShowWarrantyForm)}
                {renderFormModal("เพิ่มบริการใหม่", newService, setNewService, handleAddService, showServiceForm, setShowServiceForm)}
            </div>
        </div>
    );
}