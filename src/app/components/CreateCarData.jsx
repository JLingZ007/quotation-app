import React, { useState, useEffect } from 'react';
import { X, Car, PlusCircle, Settings, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { collection, addDoc, doc, setDoc, updateDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CarDataModal = ({ isOpen, onClose, showFeedback }) => {
    // States
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    
    // Form states
    const [showBrandForm, setShowBrandForm] = useState(false);
    const [showModelForm, setShowModelForm] = useState(false);
    const [showBrandManage, setShowBrandManage] = useState(false);
    const [showModelManage, setShowModelManage] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    const [newBrand, setNewBrand] = useState('');
    const [newModel, setNewModel] = useState('');
    const [editItem, setEditItem] = useState({ id: '', name: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load brands on component mount
    useEffect(() => {
        if (isOpen) {
            loadBrands();
        }
    }, [isOpen]);

    // Load models when brand changes
    useEffect(() => {
        if (selectedBrand) {
            loadModels();
        } else {
            setModels([]);
            setSelectedModel('');
        }
    }, [selectedBrand]);

    // Load brands from Firebase
    const loadBrands = async () => {
        try {
            const q = query(collection(db, 'brands'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const brandList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setBrands(brandList);
        } catch (error) {
            console.error("Error loading brands:", error);
            showFeedback("ไม่สามารถโหลดข้อมูลยี่ห้อได้", "error");
        }
    };

    // Load models from Firebase
    const loadModels = async () => {
        if (!selectedBrand) return;
        try {
            const q = query(collection(db, 'brands', selectedBrand, 'models'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const modelList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setModels(modelList);
        } catch (error) {
            console.error("Error loading models:", error);
            showFeedback("ไม่สามารถโหลดข้อมูลรุ่นรถได้", "error");
        }
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

    // Save edited item
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editItem.name.trim()) return;

        try {
            let docRef;
            switch (editItem.type) {
                case 'brand':
                    docRef = doc(db, 'brands', editItem.id);
                    await updateDoc(docRef, { name: editItem.name.trim() });
                    setBrands(brands.map(item => 
                        item.id === editItem.id ? { ...item, name: editItem.name.trim() } : item
                    ));
                    break;
                case 'model':
                    docRef = doc(db, 'brands', selectedBrand, 'models', editItem.id);
                    await updateDoc(docRef, { name: editItem.name.trim() });
                    setModels(models.map(item => 
                        item.id === editItem.id ? { ...item, name: editItem.name.trim() } : item
                    ));
                    break;
            }
            
            setShowEditModal(false);
            setEditItem({ id: '', name: '', type: '' });
            showFeedback("แก้ไขข้อมูลสำเร็จ");
        } catch (error) {
            console.error("Error updating item:", error);
            showFeedback("ไม่สามารถแก้ไขข้อมูลได้", "error");
        }
    };

    // Delete item
    const handleDelete = async (item, type) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ "${item.name}"?`)) return;

        try {
            let docRef;
            switch (type) {
                case 'brand':
                    docRef = doc(db, 'brands', item.id);
                    await deleteDoc(docRef);
                    setBrands(brands.filter(brand => brand.id !== item.id));
                    if (selectedBrand === item.id) {
                        setSelectedBrand('');
                        setSelectedModel('');
                    }
                    break;
                case 'model':
                    docRef = doc(db, 'brands', selectedBrand, 'models', item.id);
                    await deleteDoc(docRef);
                    setModels(models.filter(model => model.id !== item.id));
                    if (selectedModel === item.id) {
                        setSelectedModel('');
                    }
                    break;
            }
            
            showFeedback("ลบข้อมูลสำเร็จ");
        } catch (error) {
            console.error("Error deleting item:", error);
            showFeedback("ไม่สามารถลบข้อมูลได้", "error");
        }
    };

    // Submit form data
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBrand || !selectedModel) {
            return showFeedback("กรุณาเลือกยี่ห้อและรุ่นรถ", "error");
        }
        
        setIsSubmitting(true);
        
        try {
            const carData = {
                brandId: selectedBrand,
                modelId: selectedModel,
                brandName: brands.find(b => b.id === selectedBrand)?.name,
                modelName: models.find(m => m.id === selectedModel)?.name,
                created: new Date(),
            };

            await addDoc(collection(db, 'cars'), carData);
            showFeedback("บันทึกข้อมูลรถสำเร็จ");
            
            // Reset form
            setSelectedBrand('');
            setSelectedModel('');
            onClose();
        } catch (error) {
            console.error("Error submitting car data:", error);
            showFeedback("ไม่สามารถบันทึกข้อมูลรถได้", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form when modal closes
    const handleClose = () => {
        setSelectedBrand('');
        setSelectedModel('');
        setShowBrandForm(false);
        setShowModelForm(false);
        setShowBrandManage(false);
        setShowModelManage(false);
        setShowEditModal(false);
        setNewBrand('');
        setNewModel('');
        setEditItem({ id: '', name: '', type: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">เพิ่มข้อมูลรถ</h2>
                            <p className="text-sm text-gray-500">จัดการข้อมูลยี่ห้อและรุ่นรถ</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                            <button 
                                type="button"
                                onClick={() => setShowBrandManage(true)}
                                className="ml-2 flex items-center justify-center p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 focus:outline-none"
                                title="จัดการยี่ห้อรถ"
                            >
                                <Settings className="h-5 w-5" />
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
                            <button 
                                type="button"
                                onClick={() => setShowModelManage(true)}
                                className="ml-2 flex items-center justify-center p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 focus:outline-none"
                                disabled={!selectedBrand}
                                title="จัดการรุ่นรถ"
                            >
                                <Settings className="h-5 w-5" />
                            </button>
                        </div>
                        {!selectedBrand && (
                            <p className="mt-1 text-sm text-gray-500">โปรดเลือกยี่ห้อรถก่อน</p>
                        )}
                    </div>

                    {/* Submit buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button 
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            type="submit"
                            disabled={!selectedBrand || !selectedModel || isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Add Brand Modal */}
            {showBrandForm && (
                <div className="fixed inset-0 bg-black/70 bg-opacity-80 flex items-center justify-center z-60">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 ">
                            <h3 className="text-lg font-semibold">เพิ่มยี่ห้อรถใหม่</h3>
                            <button onClick={() => setShowBrandForm(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddBrand} className="p-4">
                            <input
                                type="text"
                                placeholder="ชื่อยี่ห้อรถ"
                                value={newBrand}
                                onChange={e => setNewBrand(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="flex justify-end space-x-2 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowBrandForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    เพิ่ม
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Model Modal */}
            {showModelForm && (
                <div className="fixed inset-0 bg-black/70 bg-opacity-80 flex items-center justify-center z-60">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 ">
                            <h3 className="text-lg font-semibold">เพิ่มรุ่นรถใหม่</h3>
                            <button onClick={() => setShowModelForm(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddModel} className="p-4">
                            <input
                                type="text"
                                placeholder="ชื่อรุ่นรถ"
                                value={newModel}
                                onChange={e => setNewModel(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="flex justify-end space-x-2 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModelForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    เพิ่ม
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Brand Management Modal */}
            {showBrandManage && (
                <div className="fixed inset-0 bg-black/70 bg-opacity-80 flex items-center justify-center z-60">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 ">
                            <h3 className="text-lg font-semibold">จัดการยี่ห้อรถ</h3>
                            <button onClick={() => setShowBrandManage(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            {brands.map(brand => (
                                <div key={brand.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                    <span>{brand.name}</span>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => {
                                                setEditItem({ id: brand.id, name: brand.name, type: 'brand' });
                                                setShowEditModal(true);
                                            }}
                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(brand, 'brand')}
                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Model Management Modal */}
            {showModelManage && selectedBrand && (
                <div className="fixed inset-0 bg-black/70 bg-opacity-80 flex items-center justify-center z-60">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 ">
                            <h3 className="text-lg font-semibold">จัดการรุ่นรถ</h3>
                            <button onClick={() => setShowModelManage(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            {models.map(model => (
                                <div key={model.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                    <span>{model.name}</span>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => {
                                                setEditItem({ id: model.id, name: model.name, type: 'model' });
                                                setShowEditModal(true);
                                            }}
                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(model, 'model')}
                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/80 bg-opacity-90 flex items-center justify-center z-70">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 ">
                            <h3 className="text-lg font-semibold">แก้ไขข้อมูล</h3>
                            <button onClick={() => setShowEditModal(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-4">
                            <input
                                type="text"
                                value={editItem.name}
                                onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="flex justify-end space-x-2 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
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
            )}
        </div>
    );
};

export default CarDataModal;