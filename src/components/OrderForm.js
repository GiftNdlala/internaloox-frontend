import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaBox, 
  FaDollarSign,
  FaCalendarAlt,
  FaSave,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';
import { getProducts, getColors, getFabrics, getCustomers, createCustomer } from './api';

const OrderForm = ({ onClose, onSubmit, loading = false, initialData = null, initialItems = null, isEdit = false }) => {
  // Customer/Order-level info
  const [customerData, setCustomerData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    expectedDeliveryDate: '',
    adminNotes: '',
    depositAmount: '',
    paymentStatus: 'deposit_only',
    orderStatus: 'pending',
  });
  // Delivery option
  const [withDelivery, setWithDelivery] = useState(false);
  // Proof of Payment (required for EFT-only business at order creation)
  const [popFile, setPopFile] = useState(null);
  // Product being added
  const [productForm, setProductForm] = useState({
    productId: '',
    productName: '',
    productDescription: '',
    quantity: 1,
    unitPrice: '',
    color: '',
    fabric: '',
  });
  // Cart of products for this order
  const [orderItems, setOrderItems] = useState([]);
  // Option lists
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  // Error state
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProducts().then(data => setProducts(data.results || data)).catch(() => setProducts([]));
    getColors().then(data => setColors(data.results || data)).catch(() => setColors([]));
    getFabrics().then(data => setFabrics(data.results || data)).catch(() => setFabrics([]));
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (initialData) {
      setCustomerData({
        customerName: initialData.customerName || '',
        customerPhone: initialData.customerPhone || '',
        customerEmail: initialData.customerEmail || '',
        customerAddress: initialData.customerAddress || '',
        expectedDeliveryDate: initialData.expectedDeliveryDate || '',
        adminNotes: initialData.adminNotes || '',
        depositAmount: initialData.depositAmount || '',
        paymentStatus: initialData.paymentStatus || 'deposit_only',
        orderStatus: initialData.orderStatus || 'pending',
      });
    }
    if (initialItems) {
      setOrderItems(initialItems);
    }
  }, [initialData, initialItems]);

  // Handlers for customer/order-level info
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  // Handlers for product form
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    let update = { [name]: value };
    if (name === 'productId') {
      const selected = products.find(p => String(p.id) === String(value));
      update.productName = selected ? selected.name : '';
      update.productDescription = selected ? selected.description : '';
      // Prefer unit_price, then base_price, then price
      update.unitPrice = selected ? (selected.unit_price ?? selected.base_price ?? selected.price ?? '') : '';
      update.color = '';
      update.fabric = '';
    }
    setProductForm(prev => ({ ...prev, ...update }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  // Add product to orderItems
  const handleAddProduct = () => {
    // Validate productForm
    const newErrors = {};
    if (!productForm.productId) newErrors.productId = 'Product is required';
    if (!productForm.unitPrice || parseFloat(productForm.unitPrice) <= 0) newErrors.unitPrice = 'Valid unit price is required';
    if (!productForm.quantity || parseInt(productForm.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    // Require color/fabric if the selected product has available options
    if (showColor && !productForm.color) newErrors.color = 'Please select a color for this product';
    if (showFabric && !productForm.fabric) newErrors.fabric = 'Please select a fabric for this product';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setOrderItems(items => [...items, { ...productForm }]);
    setProductForm({ productId: '', productName: '', productDescription: '', quantity: 1, unitPrice: '', color: '', fabric: '' });
  };
  // Remove product from orderItems
  const handleRemoveProduct = (idx) => {
    setOrderItems(items => items.filter((_, i) => i !== idx));
  };
  // Edit product in orderItems (optional, for now just remove+re-add)

  // Calculate totals
  const calculateTotal = () => orderItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0), 0).toFixed(2);
  const calculateBalance = () => {
    const total = parseFloat(calculateTotal());
    const deposit = parseFloat(customerData.depositAmount) || 0;
    return (total - deposit).toFixed(2);
  };

  // Product option logic
  const selectedProduct = products.find(p => String(p.id) === String(productForm.productId));
  const productColorsList = Array.isArray(selectedProduct?.colors)
    ? selectedProduct.colors
    : (Array.isArray(selectedProduct?.available_colors) ? selectedProduct.available_colors : []);
  const productFabricsList = Array.isArray(selectedProduct?.fabrics)
    ? selectedProduct.fabrics
    : (Array.isArray(selectedProduct?.available_fabrics) ? selectedProduct.available_fabrics : []);

  const normalizeValuesSet = (list) => {
    const values = new Set();
    (list || []).forEach((item) => {
      if (!item) return;
      if (typeof item === 'string') {
        values.add(item.trim().toLowerCase());
      } else if (typeof item === 'object') {
        if (item.name) values.add(String(item.name).trim().toLowerCase());
        if (item.code) values.add(String(item.code).trim().toLowerCase());
        if (item.color_name) values.add(String(item.color_name).trim().toLowerCase());
        if (item.color_code) values.add(String(item.color_code).trim().toLowerCase());
        if (item.fabric_name) values.add(String(item.fabric_name).trim().toLowerCase());
        if (item.fabric_letter) values.add(String(item.fabric_letter).trim().toLowerCase());
      }
    });
    return values;
  };

  const colorValuesSet = normalizeValuesSet(productColorsList);
  const fabricValuesSet = normalizeValuesSet(productFabricsList);

  const allowedColors = (colors || []).filter((c) => {
    const name = (c?.name || c?.color_name || '').toString().trim().toLowerCase();
    const code = (c?.code || c?.color_code || '').toString().trim().toLowerCase();
    if (colorValuesSet.size === 0) return false;
    return (name && colorValuesSet.has(name)) || (code && colorValuesSet.has(code));
  });
  const allowedFabrics = (fabrics || []).filter((f) => {
    const name = (f?.name || f?.fabric_name || '').toString().trim().toLowerCase();
    const code = (f?.code || f?.fabric_letter || '').toString().trim().toLowerCase();
    if (fabricValuesSet.size === 0) return false;
    return (name && fabricValuesSet.has(name)) || (code && fabricValuesSet.has(code));
  });

  const showColor = colorValuesSet.size > 0;
  const showFabric = fabricValuesSet.size > 0;

  // Validate and submit full order
  const validateOrder = () => {
    const newErrors = {};
    
    // Customer validation
    if (!customerData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!customerData.customerPhone.trim()) newErrors.customerPhone = 'Customer phone is required';
    if (withDelivery && !customerData.customerAddress.trim()) newErrors.customerAddress = 'Customer address is required for delivery';
    if (withDelivery && !customerData.expectedDeliveryDate) newErrors.expectedDeliveryDate = 'Expected delivery date is required for delivery';
    
    // Financial validation
    if (!customerData.depositAmount || parseFloat(customerData.depositAmount) < 0) {
      newErrors.depositAmount = 'Valid deposit amount is required';
    } else if (parseFloat(customerData.depositAmount) > parseFloat(calculateTotal())) {
      newErrors.depositAmount = 'Deposit amount cannot exceed total amount';
    }
    
    // Products validation - order can be created with at least one product
    if (orderItems.length === 0) {
      newErrors.orderItems = 'Please add at least one product to the order using the "Add Product" button above';
    }

    // Proof of payment required for new orders (EFT-only business)
    if (!isEdit && !popFile) {
      newErrors.popFile = 'Proof of payment is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateOrder()) return;
    setSubmitting(true);
    try {
      // 1. Try to find existing customer by name+phone
      const allCustomers = await getCustomers();
      const match = (allCustomers.results || allCustomers).find(c =>
        c.name.trim().toLowerCase() === customerData.customerName.trim().toLowerCase() &&
        c.phone.replace(/\D/g, '') === customerData.customerPhone.replace(/\D/g, '')
      );
      let customerId;
      if (match) {
        customerId = match.id;
      } else {
        // 2. Create new customer
        const newCustomer = await createCustomer({
          name: customerData.customerName,
          phone: customerData.customerPhone,
          email: customerData.customerEmail,
          ...(withDelivery && { address: customerData.customerAddress })
        });
        customerId = newCustomer.id;
      }
      // 3. Prepare and send order
      const totalAmount = calculateTotal();
      const depositAmount = parseFloat(customerData.depositAmount);
      const balanceAmount = (parseFloat(totalAmount) - depositAmount).toFixed(2);
      const payload = {
        customer_id: customerId,
        expected_delivery_date: customerData.expectedDeliveryDate,
        admin_notes: customerData.adminNotes,
        deposit_amount: depositAmount.toFixed(2),
        payment_status: customerData.paymentStatus,
        order_status: customerData.orderStatus,
        production_status: 'not_started', // Add missing production_status field
        total_amount: totalAmount,
        balance_amount: balanceAmount,
        items_data: orderItems.map(item => {
          const colorObj = colors.find(c => String(c.id) === String(item.color));
          const fabricObj = fabrics.find(f => String(f.id) === String(item.fabric));
          return {
            product: item.productId,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unitPrice),
            // Keep legacy IDs for backward compatibility; backend will ignore invalid legacy FKs
            color: item.color || null,
            fabric: item.fabric || null,
            // New code-based fields for robust mapping
            assigned_color_code: colorObj?.color_code || colorObj?.code || null,
            assigned_fabric_letter: fabricObj?.fabric_letter || fabricObj?.code || null,
            product_description: item.productDescription || '',
          };
        }),
        popFile: popFile || null,
        popNotes: customerData.adminNotes || '',
      };
      onSubmit(payload);
    } catch (err) {
      setErrors(prev => ({ ...prev, customer: 'Failed to create or find customer: ' + (err.message || 'Unknown error') }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Order' : 'Add New Order'}</h2>
              <p className="text-gray-600">{isEdit ? 'Edit the order details below' : 'Create a new order for customer'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200" type="button">
              <FaTimes className="text-gray-500" />
            </button>
          </div>
        </div>
        {/* Customer Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <FaUser className="mr-2" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
              <input type="text" name="customerName" value={customerData.customerName} onChange={handleCustomerChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.customerName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter customer name" />
              {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-3 text-gray-400" />
                <input type="tel" name="customerPhone" value={customerData.customerPhone} onChange={handleCustomerChange} className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.customerPhone ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter phone number" />
              </div>
              {errors.customerPhone && <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>}
            </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input type="email" name="customerEmail" value={customerData.customerEmail} onChange={handleCustomerChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter email address" />
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="withDelivery"
                  checked={withDelivery}
                  onChange={(e) => setWithDelivery(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="withDelivery" className="ml-2 text-sm font-medium text-gray-700">
                  🚚 This order requires delivery
                </label>
              </div>
            </div>
            {withDelivery && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                <input type="text" name="customerAddress" value={customerData.customerAddress} onChange={handleCustomerChange} className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.customerAddress ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter delivery address" />
              </div>
              {errors.customerAddress && <p className="text-red-500 text-sm mt-1">{errors.customerAddress}</p>}
            </div>
            )}
          </div>
        </div>
        {/* Product Cart Section */}
        <div className="bg-green-50 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <FaBox className="mr-2" /> Products in Order
            </h3>
          {/* Add Product Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
              <select name="productId" value={productForm.productId} onChange={handleProductChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.productId ? 'border-red-500' : 'border-gray-300'}`} required>
                <option value="">Select a product</option>
                {products.filter(p => p.available_for_order).map(product => (
                  <option key={product.id} value={product.id}>{product.name} ({product.model_code})</option>
                ))}
              </select>
              {errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
              <textarea name="productDescription" value={productForm.productDescription} onChange={handleProductChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Enter product description, specifications, or special requirements" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input type="number" name="quantity" value={productForm.quantity} onChange={handleProductChange} min="1" className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`} placeholder="1" />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (R) *</label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                <input type="number" name="unitPrice" value={productForm.unitPrice} onChange={handleProductChange} step="0.01" min="0" className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.unitPrice ? 'border-red-500' : 'border-gray-300'}`} placeholder="0.00" />
              </div>
              {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice}</p>}
              </div>
            {showColor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <select name="color" value={productForm.color} onChange={handleProductChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.color ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select color</option>
                  {(allowedColors.length > 0 ? allowedColors : colors).map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.color_name}</option>
                  ))}
                </select>
                {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
                <p className="text-xs text-gray-500 mt-1">This product has multiple color options. Please select one.</p>
              </div>
            )}
            {showFabric && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fabric</label>
                <select name="fabric" value={productForm.fabric} onChange={handleProductChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.fabric ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select fabric</option>
                  {(allowedFabrics.length > 0 ? allowedFabrics : fabrics).map(f => (
                    <option key={f.id} value={f.id}>{f.name || f.fabric_name}</option>
                  ))}
                </select>
                {errors.fabric && <p className="text-red-500 text-sm mt-1">{errors.fabric}</p>}
                <p className="text-xs text-gray-500 mt-1">This product has multiple fabric options. Please select one.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end mb-2">
            <button type="button" onClick={handleAddProduct} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all">Add Product</button>
            </div>
          {/* Cart Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Qty</th>
                  <th className="px-3 py-2 text-left">Unit Price</th>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-left">Fabric</th>
                  <th className="px-3 py-2 text-left">Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.length === 0 ? (
                  <tr><td colSpan="8" className="text-center text-gray-400 py-4">No products added yet</td></tr>
                ) : orderItems.map((item, idx) => {
                  const prod = products.find(p => String(p.id) === String(item.productId));
                  const colorObj = colors.find(c => String(c.id) === String(item.color));
                  const fabricObj = fabrics.find(f => String(f.id) === String(item.fabric));
                  return (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{prod ? prod.name : item.productName}</td>
                      <td className="px-3 py-2">{item.productDescription}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">R{item.unitPrice}</td>
                      <td className="px-3 py-2">{colorObj ? colorObj.name : ''}</td>
                      <td className="px-3 py-2">{fabricObj ? fabricObj.name : ''}</td>
                      <td className="px-3 py-2">R{(parseFloat(item.unitPrice) * parseInt(item.quantity)).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => handleRemoveProduct(idx)} className="text-red-600 hover:underline">Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {errors.orderItems && <p className="text-red-500 text-sm mt-1">{errors.orderItems}</p>}
          </div>
        </div>
        {/* Financial Section */}
        <div className="bg-yellow-50 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
            <FaDollarSign className="mr-2" /> Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <span className="text-lg font-semibold">R{calculateTotal()}</span>
              </div>
            </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (R) *</label>
                <div className="relative">
                  <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                <input type="number" name="depositAmount" value={customerData.depositAmount} onChange={handleCustomerChange} step="0.01" min="0" max={calculateTotal()} className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.depositAmount ? 'border-red-500' : 'border-gray-300'}`} placeholder="0.00" />
              </div>
              {errors.depositAmount && <p className="text-red-500 text-sm mt-1">{errors.depositAmount}</p>}
            </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Balance Amount</label>
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <span className="text-lg font-semibold">R{calculateBalance()}</span>
              </div>
            </div>
          </div>
          {!isEdit && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Payment (PDF/Image) *</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e)=>setPopFile(e.target.files?.[0] || null)} className={`w-full px-3 py-2 border rounded-lg ${errors.popFile ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.popFile && <p className="text-red-500 text-sm mt-1">{errors.popFile}</p>}
            </div>
          )}
        </div>
        {/* Delivery Section */}
        <div className="bg-purple-50 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
            <FaCalendarAlt className="mr-2" /> Delivery Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {withDelivery && (
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date *</label>
              <input type="date" name="expectedDeliveryDate" value={customerData.expectedDeliveryDate} onChange={handleCustomerChange} min={new Date().toISOString().split('T')[0]} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.expectedDeliveryDate ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.expectedDeliveryDate && <p className="text-red-500 text-sm mt-1">{errors.expectedDeliveryDate}</p>}
              </div>
              )}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
              <select name="orderStatus" value={customerData.orderStatus || 'pending'} onChange={handleCustomerChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed (Deposit Paid)</option>
                  <option value="in_production">In Production</option>
                </select>
              </div>
            </div>
          </div>
          {/* Notes Section */}
        <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
            <textarea name="adminNotes" value={customerData.adminNotes} onChange={handleCustomerChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500" placeholder="Enter any additional notes, special instructions, or order source (phone call, WhatsApp, etc.)" />
          </div>
        </div>
          {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-4">
          <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">Cancel</button>
          <button type="submit" disabled={loading || submitting} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            {loading ? (<><FaSpinner className="animate-spin mr-2" />{isEdit ? 'Saving...' : 'Creating Order...'}</>) : (<><FaSave className="mr-2" />{isEdit ? 'Save Changes' : 'Create Order'}</>)}
            </button>
          </div>
        </form>
    </div>
  );
};

export default OrderForm; 