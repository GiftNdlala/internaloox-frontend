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
    paymentType: 'EFT', // Default to EFT, can be changed to 'Cash'
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
    // Discount inputs (per-item)
    discountPercent: '', // 0-100
    discountAmount: '',  // final per-unit price after discount
  });
  // Cart of products for this order
  const [orderItems, setOrderItems] = useState([]);
  // Discount & Lay-Buy toggles
  const [enableItemDiscounts, setEnableItemDiscounts] = useState(false);
  const [enableOrderDiscount, setEnableOrderDiscount] = useState(false);
  const [orderDiscountType, setOrderDiscountType] = useState('percent'); // 'percent' | 'amount'
  const [orderDiscountPercent, setOrderDiscountPercent] = useState('');
  const [orderDiscountAmount, setOrderDiscountAmount] = useState(''); // final total after discount
  const [requestLaybuyAfterCreate, setRequestLaybuyAfterCreate] = useState(false);
  const [laybuyTerms, setLaybuyTerms] = useState('60_days');
  const [laybuyDueDate, setLaybuyDueDate] = useState('');
  // Option lists
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  // Product search filter
  const [productSearch, setProductSearch] = useState('');
  // Error state
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load all required data with better error handling
    const loadData = async () => {
      try {
        const [productsData, colorsData, fabricsData] = await Promise.all([
          getProducts().catch(err => {
            console.error('Failed to load products:', err);
            return { results: [] };
          }),
          getColors().catch(err => {
            console.error('Failed to load colors:', err);
            return { results: [] };
          }),
          getFabrics().catch(err => {
            console.error('Failed to load fabrics:', err);
            return { results: [] };
          })
        ]);
        
        const products = productsData.results || productsData || [];
        const colors = colorsData.results || colorsData || [];
        const fabrics = fabricsData.results || fabricsData || [];
        
        console.log('Loaded products:', products.length);
        console.log('Loaded colors:', colors.length, colors);
        console.log('Loaded fabrics:', fabrics.length, fabrics);
        
        setProducts(products);
        setColors(colors);
        setFabrics(fabrics);
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };
    
    loadData();
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
      update.discountPercent = '';
      update.discountAmount = '';
    }
    setProductForm(prev => ({ ...prev, ...update }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  // Derived filtered products list for the dropdown
  const filteredProducts = (products || []).filter(p => {
    if (!p || !p.available_for_order) return false;
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    const name = String(p.name || '').toLowerCase();
    const code = String(p.model_code || '').toLowerCase();
    return name.includes(q) || code.includes(q);
  });
  // Add product to orderItems
  const handleAddProduct = () => {
    // Validate productForm
    const newErrors = {};
    // Relaxed validation: allow adding product entries without forcing selection fields,
    // but still guard against non-positive quantity or price
    if (!productForm.productId) newErrors.productId = 'Please select a product';
    if (!productForm.quantity || parseInt(productForm.quantity) <= 0) newErrors.quantity = 'Quantity must be at least 1';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log('Product validation errors:', newErrors);
      return;
    }
    
    // Log the product being added for debugging
    const colorObj = colors.find(c => String(c.id) === String(productForm.color));
    const fabricObj = fabrics.find(f => String(f.id) === String(productForm.fabric));
    
    console.log('Adding product to order:', {
      productId: productForm.productId,
      productName: productForm.productName,
      colorId: productForm.color,
      colorName: colorObj ? (colorObj.name || colorObj.color_name || colorObj.color_code) : 'Not found',
      fabricId: productForm.fabric,
      fabricName: fabricObj ? (fabricObj.name || fabricObj.fabric_name || fabricObj.fabric_letter) : 'Not found',
      quantity: productForm.quantity,
      unitPrice: productForm.unitPrice
    });
    
    // Log the current state of colors and fabrics arrays
    console.log('Current colors array:', colors.length, 'items');
    console.log('Current fabrics array:', fabrics.length, 'items');
    
    // Create a copy of the product form to add to orderItems
    const productToAdd = { ...productForm };
    console.log('Product to add:', productToAdd);
    
    setOrderItems(items => {
      const newItems = [...items, productToAdd];
      console.log('Updated orderItems:', newItems);
      return newItems;
    });
    
    setProductForm({ productId: '', productName: '', productDescription: '', quantity: 1, unitPrice: '', color: '', fabric: '', discountPercent: '', discountAmount: '' });
  };
  // Remove product from orderItems
  const handleRemoveProduct = (idx) => {
    setOrderItems(items => items.filter((_, i) => i !== idx));
  };
  // Edit product in orderItems (optional, for now just remove+re-add)

  // Calculate totals with discounts
  const computeItemUnitFinal = (item) => {
    const base = parseFloat(item.unitPrice) || 0;
    const pct = parseFloat(item.discountPercent);
    const finalAmt = item.discountAmount !== '' ? parseFloat(item.discountAmount) : NaN;
    if (enableItemDiscounts) {
      if (!isNaN(finalAmt)) return Math.max(0, finalAmt);
      if (!isNaN(pct)) return Math.max(0, base * (1 - Math.min(Math.max(pct, 0), 100) / 100));
    }
    return base;
  };
  const calculateSubtotal = () => orderItems.reduce((sum, item) => sum + computeItemUnitFinal(item) * (parseInt(item.quantity) || 0), 0);
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (enableOrderDiscount) {
      if (orderDiscountType === 'percent') {
        const pct = Math.min(Math.max(parseFloat(orderDiscountPercent) || 0, 0), 100);
        return (subtotal * (1 - pct / 100)).toFixed(2);
      } else if (orderDiscountType === 'amount') {
        const finalTotal = parseFloat(orderDiscountAmount);
        if (!isNaN(finalTotal) && finalTotal >= 0) return finalTotal.toFixed(2);
      }
    }
    return subtotal.toFixed(2);
  };
  const calculateBalance = () => {
    const total = parseFloat(calculateTotal());
    const deposit = parseFloat(customerData.depositAmount) || 0;
    return (total - deposit).toFixed(2);
  };

  // Product option logic
  const selectedProduct = products.find(p => String(p.id) === String(productForm.productId));
  
  // Fix: Properly extract colors and fabrics from product data
  const productColorsList = selectedProduct?.colors || selectedProduct?.available_colors || [];
  const productFabricsList = selectedProduct?.fabrics || selectedProduct?.available_fabrics || [];

  // Debug logging to understand the data structure
  console.log('Selected product:', selectedProduct);
  console.log('Product colors:', productColorsList);
  console.log('Product fabrics:', productFabricsList);

  const normalizeValuesSet = (list) => {
    const values = new Set();
    if (!list || !Array.isArray(list)) return values;
    
    list.forEach((item) => {
      if (!item) return;
      
      if (typeof item === 'string') {
        // Handle simple string arrays like ["Brown", "Green", "Navy Blue"]
        values.add(item.trim().toLowerCase());
      } else if (typeof item === 'object') {
        // Handle object arrays with name/code properties
        if (item.name) values.add(String(item.name).trim().toLowerCase());
        if (item.code) values.add(String(item.code).trim().toLowerCase());
        if (item.color_name) values.add(String(item.color_name).trim().toLowerCase());
        if (item.color_code) values.add(String(item.color_code).trim().toLowerCase());
        if (item.fabric_name) values.add(String(item.fabric_name).trim().toLowerCase());
        if (item.fabric_letter) values.add(String(item.fabric_letter).trim().toLowerCase());
      }
    });
    
    console.log('Normalized values:', Array.from(values));
    return values;
  };

  const colorValuesSet = normalizeValuesSet(productColorsList);
  const fabricValuesSet = normalizeValuesSet(productFabricsList);

  // Fix: Simplify the filtering logic to show all available colors/fabrics
  const allowedColors = colors || [];
  const allowedFabrics = fabrics || [];

  // Always show color/fabric dropdowns if there are colors/fabrics available in the system
  // and a product is selected (this ensures users can always select color/fabric for any product)
  const showColor = productForm.productId && allowedColors.length > 0;
  const showFabric = productForm.productId && allowedFabrics.length > 0;

  console.log('Show color dropdown:', showColor, 'Available colors:', allowedColors.length);
  console.log('Show fabric dropdown:', showFabric, 'Available fabrics:', allowedFabrics.length);
  console.log('Product selected:', productForm.productId, 'Product name:', productForm.productName);

  // Validate and submit full order
  const validateOrder = () => {
    const newErrors = {};
    
    // Customer validation
    if (!customerData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!customerData.customerPhone.trim()) newErrors.customerPhone = 'Customer phone is required';
    if (withDelivery && !customerData.customerAddress.trim()) newErrors.customerAddress = 'Customer address is required for delivery';
    if (withDelivery && !customerData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Expected delivery date is required for delivery';
    } else if (withDelivery && customerData.expectedDeliveryDate) {
      // Validate date format
      const date = new Date(customerData.expectedDeliveryDate);
      if (isNaN(date.getTime())) {
        newErrors.expectedDeliveryDate = 'Please enter a valid delivery date';
      } else if (date < new Date()) {
        newErrors.expectedDeliveryDate = 'Delivery date cannot be in the past';
      }
    }
    
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

    // Proof of payment required only for EFT payments (not for cash payments)
    if (!isEdit && customerData.paymentType === 'EFT' && !popFile) {
      newErrors.popFile = 'Proof of payment is required for EFT payments';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateOrder()) {
      setFormError('Please correct the highlighted errors before submitting.');
      return;
    }
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
      
      // Format the delivery date properly for backend
      let deliveryDate = null;
      if (customerData.expectedDeliveryDate) {
        try {
          // Ensure the date is in YYYY-MM-DD format
          const date = new Date(customerData.expectedDeliveryDate);
          if (!isNaN(date.getTime())) {
            deliveryDate = date.toISOString().split('T')[0];
          } else {
            // Fallback: try to parse the date string directly
            const dateStr = customerData.expectedDeliveryDate;
            if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              deliveryDate = dateStr;
            }
          }
          
          // Final validation: ensure the date is in the correct format
          if (deliveryDate && !deliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.error('Invalid date format:', deliveryDate);
            deliveryDate = null;
          }
        } catch (error) {
          console.error('Error formatting delivery date:', error);
          deliveryDate = null;
        }
      }
      
      const payload = {
        customer_id: customerId,
        expected_delivery_date: deliveryDate,
        admin_notes: customerData.adminNotes,
        deposit_amount: depositAmount.toFixed(2),
        payment_status: customerData.paymentStatus,
        payment_method: customerData.paymentType, // Include payment type
        order_status: customerData.orderStatus,
        production_status: 'not_started', // Add missing production_status field
        total_amount: totalAmount,
        balance_amount: balanceAmount,
        // Order-level discounts
        ...(enableOrderDiscount && orderDiscountType === 'percent' ? { order_discount_percent: Math.min(Math.max(parseFloat(orderDiscountPercent) || 0, 0), 100) } : {}),
        ...(enableOrderDiscount && orderDiscountType === 'amount' ? { order_discount_amount: (orderDiscountAmount || '').toString() } : {}),
        items_data: orderItems.map((item, index) => {
          const colorObj = colors.find(c => String(c.id) === String(item.color));
          const fabricObj = fabrics.find(f => String(f.id) === String(item.fabric));
          
          // Debug logging for each item
          console.log(`Item ${index} - Processing:`, {
            productId: item.productId,
            colorId: item.color,
            fabricId: item.fabric,
            colorObj: colorObj,
            fabricObj: fabricObj
          });
          
          const processedItem = {
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
          // Item-level discounts: choose one
          if (enableItemDiscounts) {
            const pct = parseFloat(item.discountPercent);
            const amt = item.discountAmount !== '' ? item.discountAmount : '';
            if (amt !== '') {
              processedItem.discount_amount = amt.toString();
            } else if (!isNaN(pct)) {
              processedItem.discount_percent = Math.min(Math.max(pct, 0), 100);
            }
          }
          
          console.log(`Item ${index} - Processed:`, processedItem);
          return processedItem;
        }),
        popFile: popFile || null,
        popNotes: customerData.adminNotes || '',
      };
      
      // Debug logging
      console.log('OrderForm - Delivery Date:', customerData.expectedDeliveryDate);
      console.log('OrderForm - Formatted Date:', deliveryDate);
      console.log('OrderForm - Full Payload:', payload);
      
      // Final validation: if delivery is required but date is invalid, show error
      if (withDelivery && !deliveryDate) {
        setErrors(prev => ({ ...prev, expectedDeliveryDate: 'Please enter a valid delivery date in YYYY-MM-DD format' }));
        return;
      }
      
      // Provide lay-buy request metadata to parent handler
      if (requestLaybuyAfterCreate) {
        payload.__laybuy_request__ = {
          deposit_amount: depositAmount.toFixed(2),
          laybuy_terms: laybuyTerms,
          laybuy_due_date: laybuyTerms === 'custom' ? laybuyDueDate || null : null
        };
      }
      await onSubmit(payload);
      setFormSuccess(isEdit ? 'Order updated successfully.' : 'Order created successfully.');
      setFormError('');
    } catch (err) {
      setFormError(err?.message || 'Failed to submit order');
    } finally {
      setSubmitting(false);
      // Debug logging can be added here if needed
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
        {/* Body */}
        <div className="px-6 pb-4">
        {/* Inline Alerts */}
        {formError && (
          <div className="px-6 pt-3">
            <div className="alert alert-danger py-2 px-3">{formError}</div>
          </div>
        )}
        {formSuccess && (
          <div className="px-6 pt-3">
            <div className="alert alert-success py-2 px-3">{formSuccess}</div>
          </div>
        )}
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
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  checked={enableItemDiscounts}
                  onChange={(e)=>setEnableItemDiscounts(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">Apply per-item discounts</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Product</label>
              <input
                type="text"
                value={productSearch}
                onChange={(e)=>setProductSearch(e.target.value)}
                placeholder="Type to filter products..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-2"
              />
              <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
              <select name="productId" value={productForm.productId} onChange={handleProductChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.productId ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select a product</option>
                {filteredProducts.map(product => (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (R)</label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                <input type="number" name="unitPrice" value={productForm.unitPrice} onChange={handleProductChange} step="0.01" min="0" className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.unitPrice ? 'border-red-500' : 'border-gray-300'}`} placeholder="0.00" />
              </div>
              {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice}</p>}
            </div>
            {showColor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <select name="color" value={productForm.color} onChange={handleProductChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option value="">Select a color</option>
                  {allowedColors.map(color => (
                    <option key={color.id} value={color.id}>{color.name || color.color_name || color.color_code}</option>
                  ))}
                </select>
              </div>
            )}
            {showFabric && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fabric</label>
                <select name="fabric" value={productForm.fabric} onChange={handleProductChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option value="">Select a fabric</option>
                  {allowedFabrics.map(fabric => (
                    <option key={fabric.id} value={fabric.id}>{fabric.name || fabric.fabric_name || fabric.fabric_letter}</option>
                  ))}
                </select>
              </div>
            )}
            {enableItemDiscounts && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percent (%)</label>
                  <input
                    type="number"
                    name="discountPercent"
                    value={productForm.discountPercent}
                    onChange={(e)=>{
                      const val = e.target.value;
                      setProductForm(prev=>({ ...prev, discountPercent: val, discountAmount: val ? '' : prev.discountAmount }));
                    }}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. 5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use either percent or final per-unit amount.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discounted Unit Amount (R)</label>
                  <input
                    type="number"
                    name="discountAmount"
                    value={productForm.discountAmount}
                    onChange={(e)=>{
                      const val = e.target.value;
                      setProductForm(prev=>({ ...prev, discountAmount: val, discountPercent: val ? '' : prev.discountPercent }));
                    }}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. 3200.00"
                  />
                </div>
              </>
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
                  
                  // Debug logging for color and fabric lookup
                  console.log(`Item ${idx} - Color ID: ${item.color}, Fabric ID: ${item.fabric}`);
                  console.log('Available colors:', colors);
                  console.log('Available fabrics:', fabrics);
                  
                  const colorObj = colors.find(c => String(c.id) === String(item.color));
                  const fabricObj = fabrics.find(f => String(f.id) === String(item.fabric));
                  
                  console.log(`Found color object:`, colorObj);
                  console.log(`Found fabric object:`, fabricObj);
                  
                  return (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{prod ? prod.name : item.productName}</td>
                      <td className="px-3 py-2">{item.productDescription}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">
                        {item.discountAmount ? (
                          <div>
                            <span className="text-red-600 line-through text-sm">R{item.unitPrice}</span>
                            <br />
                            <span className="text-green-600 font-semibold">R{item.discountAmount}</span>
                          </div>
                        ) : item.discountPercent ? (
                          <div>
                            <span className="text-red-600 line-through text-sm">R{item.unitPrice}</span>
                            <br />
                            <span className="text-green-600 font-semibold">R{(parseFloat(item.unitPrice) * (1 - parseFloat(item.discountPercent) / 100)).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span>R{item.unitPrice}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {colorObj ? (colorObj.name || colorObj.color_name || colorObj.color_code || 'Unknown Color') : (item.color ? `Color ID: ${item.color}` : 'Not specified')}
                      </td>
                      <td className="px-3 py-2">
                        {fabricObj ? (fabricObj.name || fabricObj.fabric_name || fabricObj.fabric_letter || 'Unknown Fabric') : (item.fabric ? `Fabric ID: ${item.fabric}` : 'Not specified')}
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          let effectivePrice = parseFloat(item.unitPrice);
                          if (item.discountAmount) {
                            effectivePrice = parseFloat(item.discountAmount);
                          } else if (item.discountPercent) {
                            effectivePrice = parseFloat(item.unitPrice) * (1 - parseFloat(item.discountPercent) / 100);
                          }
                          return <span>R{(effectivePrice * parseInt(item.quantity)).toFixed(2)}</span>;
                        })()}
                      </td>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-lg font-semibold">R{calculateTotal()}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
                <select 
                  name="paymentType" 
                  value={customerData.paymentType} 
                  onChange={handleCustomerChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.paymentType ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="EFT">EFT (Electronic Transfer)</option>
                  <option value="Cash">Cash Payment</option>
                </select>
                {errors.paymentType && <p className="text-red-500 text-sm mt-1">{errors.paymentType}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
            {/* Order-level discount and Lay-Buy toggles */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
                    checked={enableOrderDiscount}
                    onChange={(e)=>setEnableOrderDiscount(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">Apply order-level discount</span>
                </label>
                {enableOrderDiscount && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        value={orderDiscountType}
                        onChange={(e)=>setOrderDiscountType(e.target.value)}
                      >
                        <option value="percent">Percent (%)</option>
                        <option value="amount">Final Total (R)</option>
                      </select>
                    </div>
                    {orderDiscountType === 'percent' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Percent (%)</label>
                        <input
                          type="number"
                          value={orderDiscountPercent}
                          onChange={(e)=>setOrderDiscountPercent(e.target.value)}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="e.g. 10"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Final Total (R)</label>
                        <input
                          type="number"
                          value={orderDiscountAmount}
                          onChange={(e)=>setOrderDiscountAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="e.g. 9000.00"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    checked={requestLaybuyAfterCreate}
                    onChange={(e)=>setRequestLaybuyAfterCreate(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">Convert to Lay-Buy after creation</span>
                </label>
                {requestLaybuyAfterCreate && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lay-Buy Terms</label>
                      <select
                        value={laybuyTerms}
                        onChange={(e)=>setLaybuyTerms(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="30_days">30 Days</option>
                        <option value="60_days">60 Days</option>
                        <option value="90_days">90 Days</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    {laybuyTerms === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lay-Buy Due Date</label>
                        <input
                          type="date"
                          value={laybuyDueDate}
                          onChange={(e)=>setLaybuyDueDate(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                      <div className="text-xs text-gray-600">Deposit amount above will be used for lay-buy conversion.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {!isEdit && customerData.paymentType === 'EFT' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Payment (PDF/Image) *</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e)=>setPopFile(e.target.files?.[0] || null)} className={`w-full px-3 py-2 border rounded-lg ${errors.popFile ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.popFile && <p className="text-red-500 text-sm mt-1">{errors.popFile}</p>}
              <p className="text-xs text-gray-500 mt-1">Required for EFT payments - upload bank statement or payment confirmation</p>
            </div>
          )}
          
          {!isEdit && customerData.paymentType === 'Cash' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 mr-2">💵</div>
                <div>
                  <p className="text-sm text-green-800 font-medium">Cash Payment Selected</p>
                  <p className="text-xs text-green-600">No proof of payment required for cash payments</p>
                </div>
              </div>
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
              <input 
                type="date" 
                name="expectedDeliveryDate" 
                value={customerData.expectedDeliveryDate} 
                onChange={handleCustomerChange} 
                min={new Date().toISOString().split('T')[0]} 
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.expectedDeliveryDate ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errors.expectedDeliveryDate && <p className="text-red-500 text-sm mt-1">{errors.expectedDeliveryDate}</p>}
              <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD</p>
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