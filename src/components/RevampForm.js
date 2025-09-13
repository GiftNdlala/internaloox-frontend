import React, { useState } from 'react';
import { FaTimes, FaSave, FaSpinner, FaDollarSign, FaImage } from 'react-icons/fa';

/**
 * Revamp/Repair Order Form
 * Props:
 * - onClose: function
 * - onSubmit: function(payload)
 * - type: 'revamp' | 'repair' (defaults to 'revamp')
 */
const RevampForm = ({ onClose, onSubmit, type = 'revamp' }) => {
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [revamp, setRevamp] = useState({
    name: '',
    description: '',
    price: '',
    image: null
  });

  const [expectedDate, setExpectedDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [popFile, setPopFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!customer.name.trim()) newErrors.name = 'Customer name is required';
    if (!customer.phone.trim()) newErrors.phone = 'Customer phone is required';
    if (!revamp.name.trim()) newErrors.revampName = `${type === 'repair' ? 'Repair' : 'Revamp'} name is required`;
    if (!revamp.price || Number(revamp.price) <= 0) newErrors.price = 'Valid price is required';
    if (!depositAmount || Number(depositAmount) < 0) newErrors.deposit = 'Valid deposit is required';
    if (!popFile) newErrors.popFile = 'Payment proof is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        order_type: type, // 'revamp' | 'repair'
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || undefined,
        customer_address: customer.address || undefined,
        expected_delivery_date: expectedDate || undefined,
        admin_notes: adminNotes || '',
        // financials
        total_amount: Number(revamp.price),
        deposit_amount: Number(depositAmount),
        payment_status: 'deposit_only',
        production_status: 'not_started',
        // revamp fields (backend uses revamp_* naming)
        revamp_name: revamp.name,
        revamp_description: revamp.description || '',
        revamp_price: Number(revamp.price),
        revamp_image: revamp.image || null,
        // items: not applicable here
        items_data: [],
        // PoP passthrough for outer flow
        popFile,
        popNotes: adminNotes || ''
      };
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const previewUrl = revamp.image ? URL.createObjectURL(revamp.image) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{type === 'repair' ? 'Create Repair Order' : 'Create Revamp Order'}</h2>
              <p className="text-gray-600">Capture customer details and {type === 'repair' ? 'repair' : 'revamp'} specifics</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" type="button">
              <FaTimes className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Customer */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input className={`w-full px-3 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`} value={customer.name} onChange={(e)=>setCustomer(v=>({...v,name:e.target.value}))} />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input className={`w-full px-3 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} value={customer.phone} onChange={(e)=>setCustomer(v=>({...v,phone:e.target.value}))} />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input className="w-full px-3 py-2 border rounded-lg border-gray-300" value={customer.email} onChange={(e)=>setCustomer(v=>({...v,email:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input className="w-full px-3 py-2 border rounded-lg border-gray-300" value={customer.address} onChange={(e)=>setCustomer(v=>({...v,address:e.target.value}))} />
              </div>
            </div>
          </div>

          {/* Revamp/Repair Details */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3">{type === 'repair' ? 'Repair' : 'Revamp'} Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{type === 'repair' ? 'Repair' : 'Revamp'} Name *</label>
                <input className={`w-full px-3 py-2 border rounded-lg ${errors.revampName ? 'border-red-500' : 'border-gray-300'}`} value={revamp.name} onChange={(e)=>setRevamp(v=>({...v,name:e.target.value}))} placeholder={type === 'repair' ? 'e.g., Fix broken seam on couch' : 'e.g., Modernize L-shaped couch'} />
                {errors.revampName && <p className="text-red-500 text-sm mt-1">{errors.revampName}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea rows="3" className="w-full px-3 py-2 border rounded-lg border-gray-300" value={revamp.description} onChange={(e)=>setRevamp(v=>({...v,description:e.target.value}))} placeholder="Describe the requested work, measurements, fabric, color preferences, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (R) *</label>
                <div className="relative">
                  <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                  <input type="number" step="0.01" min="0" className={`w-full pl-10 pr-3 py-2 border rounded-lg ${errors.price ? 'border-red-500' : 'border-gray-300'}`} value={revamp.price} onChange={(e)=>setRevamp(v=>({...v,price:e.target.value}))} />
                </div>
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 flex items-center gap-2">
                    <FaImage /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e)=>setRevamp(v=>({...v,image:e.target.files?.[0] || null}))} />
                  </label>
                  {previewUrl && (
                    <img src={previewUrl} alt="preview" className="h-16 w-16 rounded object-cover border" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule and Notes */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">Schedule & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded-lg border-gray-300" value={expectedDate} onChange={(e)=>setExpectedDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <input className="w-full px-3 py-2 border rounded-lg border-gray-300" value={adminNotes} onChange={(e)=>setAdminNotes(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (R) *</label>
                <div className="relative">
                  <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                  <input type="number" step="0.01" min="0" className={`w-full pl-10 pr-3 py-2 border rounded-lg ${errors.deposit ? 'border-red-500' : 'border-gray-300'}`} value={depositAmount} onChange={(e)=>setDepositAmount(e.target.value)} />
                </div>
                {errors.deposit && <p className="text-red-500 text-sm mt-1">{errors.deposit}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Payment (PDF/Image) *</label>
                <input type="file" accept="image/*,application/pdf" className={`w-full px-3 py-2 border rounded-lg ${errors.popFile ? 'border-red-500' : 'border-gray-300'}`} onChange={(e)=>setPopFile(e.target.files?.[0] || null)} />
                {errors.popFile && <p className="text-red-500 text-sm mt-1">{errors.popFile}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 flex items-center">
              {submitting ? (<><FaSpinner className="animate-spin mr-2" />Saving...</>) : (<><FaSave className="mr-2" />Create {type === 'repair' ? 'Repair' : 'Revamp'}</>)}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RevampForm;

