'use client';

import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getNextRunningNumber } from '../utils/generateRunningNumber';
import Link from 'next/link';
import CarDataModal from '../components/CreateCarData';

import {
  ArrowRight
} from 'lucide-react';
import { Checkbox } from '@react-pdf/renderer';

export default function QuotationFormPage() {
  const router = useRouter();
  const params = useParams();
  const [showCarModal, setShowCarModal] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });


  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    tax_number: '',
    brand: '',
    model: '',
    year: '',
    license: '',
    province: '',
    vin: '',
    mileage: '',
    warranty: [],
    discount: '',
    deposit: '',
    remark: '',
    khonkaenWarranty: '-', // เพิ่มบรรทัดนี้
  });
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [warrantyList, setWarrantyList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [items, setItems] = useState([{ serviceId: '', unitPrice: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [subtotalPrice, setsubTotalPrice] = useState(0);


  useEffect(() => {
  const fetchData = async () => {
    const [brandSnap, warrantySnap, serviceSnap] = await Promise.all([
      getDocs(collection(db, 'brands')),
      getDocs(collection(db, 'warrantyConditions')),
      getDocs(collection(db, 'services')),
    ]);

    setBrands(
      brandSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name, 'th')) // ✅ เรียงตาม name ภาษาไทย
    );

    setWarrantyList(
      warrantySnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name, 'th')) // ✅ เรียงตาม name
    );

    setServiceList(
      serviceSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name, 'th')) // ✅ เรียงตาม name
    );
  };
  fetchData();
}, []);


  useEffect(() => {
  if (!form.brand) return setModels([]);
  getDocs(collection(db, 'brands', form.brand, 'models'))
    .then(snap => {
      const sortedModels = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name)); // ✅ เรียงตามชื่อ
      setModels(sortedModels);
    });
}, [form.brand]);


  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch('/data/thai_provinces_77.json');
        const data = await res.json();
        setProvinces(data); // สมมุติว่าคุณมี useState ชื่อ setProvinces
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการโหลดจังหวัด', err);
      }
    };
    fetchProvinces();
  }, []);


  // Calculate total price
  useEffect(() => {
    const itemTotal = items.reduce((sum, item) => sum + (parseInt(item.unitPrice) || 0), 0);
    const discount = parseInt(form.discount) || 0;
    setTotalPrice(Math.max(0, itemTotal));
  }, [items, form.discount]);

  // Calculate total price
  useEffect(() => {
    const itemTotal = items.reduce((sum, item) => sum + (parseInt(item.unitPrice) || 0), 0);
    const discount = parseInt(form.discount) || 0;
    setsubTotalPrice(Math.max(0, itemTotal - discount));
  }, [items, form.discount]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (i, f, v) => {
    const arr = [...items];
    arr[i][f] = v;
    setItems(arr);
  };

  const addItem = () => setItems(prev => [...prev, { serviceId: '', unitPrice: '' }]);

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const showFeedback = (message, type = 'success') => {
  setFeedback({ show: true, message, type });
  setTimeout(() => {
    setFeedback({ show: false, message: '', type: '' });
  }, 3000);
};

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // สร้างรหัส id_number อัตโนมัติ (YYMMNNN)
      const id_number = await getNextRunningNumber();

      // บันทึกใบเสนอราคาพร้อม id_number
      await addDoc(collection(db, 'quotes'), {
        ...form,
        items,
        totalPrice,
        id_number,
        runningNumber: id_number,
        createdAt: serverTimestamp(),
      });

      // แสดงแจ้งเตือนสำเร็จ
      const el = document.getElementById('notification');
      el.textContent = `✅ บันทึกสำเร็จ (ID: ${id_number})`;
      el.className = 'fixed top-4 right-4 flex items-center px-4 py-3 bg-green-100 text-green-700 rounded-lg shadow-lg z-50';
      setTimeout(() => el.classList.add('opacity-0'), 4000);

      // รีเซ็ตฟอร์ม
      setForm({ customerName: '', phone: '', address: '', tax_number: '', brand: '', model: '', year: '', license: '', province: '', vin: '', mileage: '', warranty: '', discount: '', deposit: '', remark: '' , khonkaenWarranty: '-' });
      setItems([{ serviceId: '', unitPrice: '' }]);
      router.push('/');
    } catch (err) {
      console.error(err);
      const el = document.getElementById('notification');
      el.textContent = '❌ เกิดข้อผิดพลาด กรุณาลองใหม่';
      el.className = 'fixed top-4 right-4 flex items-center px-4 py-3 bg-red-100 text-red-700 rounded-lg shadow-lg z-50';
      setTimeout(() => el.classList.add('opacity-0'), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      <div
        id="notification"
        className="hidden fixed top-4 right-4 items-center px-4 py-3 rounded-lg shadow transition-all duration-300 z-50"
        role="alert"
      >
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              สร้างรายการข้อมูลลูกค้า
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Progress Steps */}
            <div className="flex justify-between items-center mb-8">
              <div className="w-full flex items-center">
                <div className="relative flex flex-col items-center">
                  <div className="rounded-full bg-blue-600 text-white flex items-center justify-center w-10 h-10 z-10">1</div>
                  <div className="text-xs mt-1">ข้อมูลลูกค้า</div>
                </div>
                <div className="flex-1 border-t-2 border-blue-600"></div>
                <div className="relative flex flex-col items-center">
                  <div className="rounded-full bg-blue-600 text-white flex items-center justify-center w-10 h-10 z-10">2</div>
                  <div className="text-xs mt-1">ข้อมูลรถ</div>
                </div>
                <div className="flex-1 border-t-2 border-blue-600"></div>
                <div className="relative flex flex-col items-center">
                  <div className="rounded-full bg-blue-600 text-white flex items-center justify-center w-10 h-10 z-10">3</div>
                  <div className="text-xs mt-1">รายการบริการ</div>
                </div>
                <div className="flex-1 border-t-2 border-blue-600"></div>
                <div className="relative flex flex-col items-center">
                  <div className="rounded-full bg-blue-600 text-white flex items-center justify-center w-10 h-10 z-10">4</div>
                  <div className="text-xs mt-1">สรุปรายการ</div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">ข้อมูลลูกค้า</h2>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ชื่อลูกค้า */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อลูกค้า *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        name="customerName"
                        value={form.customerName}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ชื่อ-นามสกุล"
                      />
                    </div>
                  </div>

                  {/* เบอร์โทร */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="08X-XXX-XXXX"
                      />
                    </div>
                  </div>

                  {/* ที่อยู่ */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="กรอกที่อยู่สำหรับออกใบกำกับภาษี"
                    />
                  </div>

                  {/* เลขผู้เสียภาษี */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      name="tax_number"
                      value={form.tax_number}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="กรอกเลขประจำตัวผู้เสียภาษี"
                    />
                  </div>
                </div>

              </div>
            </section>

            {/* Vehicle Info */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">ข้อมูลรถ</h2>
            <p className="text-sm text-gray-500 mt-0.5">จัดการข้อมูลยานพาหนะและรายละเอียด</p>
          </div>
        </div>

        <button
          onClick={() => setShowCarModal(true)}
          className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          เพิ่มข้อมูลรถ
        </button>
      </div>

      
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ *</label>
                    <select
                      name="brand"
                      value={form.brand}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- เลือกยี่ห้อ --</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รุ่น *</label>
                    <select
                      name="model"
                      value={form.model}
                      onChange={handleChange}
                      required
                      className={`w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!form.brand ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={!form.brand}
                    >
                      <option value="">-- เลือกรุ่น --</option>
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ปี</label>
                    <input
                      name="year"
                      value={form.year}
                      onChange={handleChange}
                      // required
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ปี ค.ศ."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ทะเบียน *</label>
                    <input
                      name="license"
                      value={form.license}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="กก 1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                    <select
                      name="province"
                      value={form.province}
                      onChange={handleChange}
                      // required
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- เลือกจังหวัด --</option>
                      {provinces.map((p, i) => (<option key={i} value={p}>{p}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขตัวถัง (VIN)</label>
                    <input
                      name="vin"
                      value={form.vin}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="VIN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขไมล์ (km)</label>
                    <input
                      name="mileage"
                      value={form.mileage}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10000 "
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Service Items & Prices */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">รายการบริการ</h2>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                {items.map((it, i) => (
                  <div key={i} className="flex flex-wrap md:flex-nowrap items-end gap-4 mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                    <div className="w-full md:w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">บริการ *</label>
                      <select
                        value={it.serviceId}
                        onChange={e => handleItemChange(i, 'serviceId', e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- เลือกรายการ --</option>
                        {serviceList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="w-full md:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต่อหน่วย *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">฿</span>
                        </div>
                        <input
                          type="number"
                          value={it.unitPrice}
                          onChange={e => handleItemChange(i, 'unitPrice', e.target.value)}
                          required
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="bg-red-100 text-red-600 hover:bg-red-200 rounded-lg p-2 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      {i === items.length - 1 && (
                        <button
                          type="button"
                          onClick={addItem}
                          className="bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg p-2 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">เงื่อนไขรับประกัน</label>
                  <div className="space-y-2">
                    {warrantyList.map(w => (
                      <label key={w.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          value={w.id}
                          checked={form.warranty.includes(w.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const id = e.target.value;
                            setForm(prev => ({
                              ...prev,
                              warranty: checked
                                ? [...prev.warranty, id]
                                : prev.warranty.filter(wid => wid !== id)
                            }));
                          }}
                          className="text-blue-600 rounded"
                        />
                        <span>{w.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* Summary & Submit */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">รายละเอียดเพิ่มเติม</h2>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ส่วนลด (บาท)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">฿</span>
                      </div>
                      <input
                        name="discount"
                        type="number"
                        value={form.discount}
                        onChange={handleChange}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เงินมัดจำ (บาท)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">฿</span>
                      </div>
                      <input
                        name="deposit"
                        type="number"
                        value={form.deposit}
                        onChange={handleChange}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                  <textarea
                    name="remark"
                    value={form.remark}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="รายละเอียดเพิ่มเติม..."
                  />
                </div>
                <div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-3">การรับประกันของถึงแก่น</label>
  <div className="space-y-2">
    <label className="flex items-center space-x-2 text-sm">
      <input
        type="checkbox"
        checked={form.khonkaenWarranty === 'การรับประกันของถึงแก่น Care'}
        onChange={(e) => {
          setForm(prev => ({
            ...prev,
            khonkaenWarranty: e.target.checked ? 'การรับประกันของถึงแก่น Care' : '-'
          }));
        }}
        className="text-blue-600 rounded"
      />
      <span>การรับประกันของถึงแก่น Care</span>
    </label>
  </div>
</div>

                {/* Price Summary */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">สรุปราคา</h3>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">ราคารวมบริการ:</span>
                    <span className="font-medium">฿ {items.reduce((sum, item) => sum + (parseInt(item.unitPrice) || 0), 0).toLocaleString()}</span>
                  </div>
                  {form.discount && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">ส่วนลด:</span>
                      <span className="font-medium text-red-600">- ฿ {parseInt(form.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-t border-blue-200 mt-2 pt-2">
                    <span className="font-medium text-gray-800">ราคาสุทธิ:</span>
                    <span className="font-bold text-blue-700">฿ {subtotalPrice.toLocaleString()}</span>
                  </div>
                  {form.deposit && (
                    <div className="flex justify-between py-1 mt-2">
                      <span className="text-gray-600">เงินมัดจำ:</span>
                      <span className="font-medium">฿ {parseInt(form.deposit).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    บันทึกใบเสนอราคา
                  </>
                )}
              </button>
            </div>

            {/* Print Preview Button */}
            {items.some(item => item.serviceId && item.unitPrice) && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  พรีวิวใบเสนอราคา
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Tips & Help */}
        <div className="bg-white shadow-md rounded-lg p-5 mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            คำแนะนำในการสร้างใบเสนอราคา
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              กรอกข้อมูลลูกค้าให้ครบถ้วน เพื่อสะดวกในการติดต่อกลับ
            </li>
            <li className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ตรวจสอบรายการบริการและราคาให้ถูกต้องก่อนบันทึก
            </li>
            <li className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ระบุเงื่อนไขรับประกันให้ชัดเจนเพื่อป้องกันข้อพิพาทในอนาคต
            </li>
          </ul>
        </div>
      </div>
      {/* Modal - อยู่นอก form หลัก */}
      <CarDataModal 
        isOpen={showCarModal} 
        onClose={() => setShowCarModal(false)} 
        showFeedback={showFeedback} 
      />
    </div>

    
  );
}