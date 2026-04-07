"use client";

interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
  userId?: string;
  userName: string;
  userEmail: string;
  customerPhone?: string;
  deliveryAddress?: string;
  village?: string;
  deliveryInstructions?: string;
  paymentMethod?: string;
  category: string;
  subcategory?: string;
  status: string;
  createdAt: string;
}

export const downloadOrderAsCSV = (order: Order) => {
  // Create CSV content
  const csvContent = [
    "Order Details",
    "",
    "Order Information",
    `Order ID,${order.id}`,
    `Product,${order.productTitle}`,
    `Price,RWF ${order.productPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    `Quantity,${order.quantity}`,
    `Total Amount,RWF ${(order.productPrice * order.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    `Category,${order.category}`,
    `Subcategory,${order.subcategory || 'N/A'}`,
    `Status,${order.status}`,
    `Order Date,${new Date(order.createdAt).toLocaleString()}`,
    "",
    "Customer Information",
    `Name,${order.userName}`,
    `Email,${order.userEmail}`,
    `Phone,${order.customerPhone || 'N/A'}`,
    `Delivery Address,${order.deliveryAddress || 'N/A'}`,
    `Village,${order.village || 'N/A'}`,
    `Payment Method,${order.paymentMethod || 'N/A'}`,
    `Delivery Instructions,${order.deliveryInstructions || 'N/A'}`,
    "",
    "Order Summary",
    `Total Amount,RWF ${(order.productPrice * order.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    `Payment Status,${order.status}`,
    `Delivery Status,${order.status}`,
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `order_${order.id}_${order.productTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadOrderAsPDF = (order: Order) => {
  // Create a professional HTML template for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order Details - ${order.id}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
        }
        
        .header h1 { 
          color: #007bff; 
          margin: 0;
          font-size: 28px;
        }
        
        .header p { 
          color: #666; 
          margin: 5px 0;
          font-size: 14px;
        }
        
        .section { 
          margin-bottom: 25px; 
          page-break-inside: avoid;
        }
        
        .section h2 { 
          color: #333; 
          border-bottom: 2px solid #007bff; 
          padding-bottom: 8px;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .info-row { 
          margin-bottom: 8px; 
        }
        
        .label { 
          font-weight: 600; 
          color: #555; 
          display: inline-block;
          min-width: 120px;
        }
        
        .value { 
          color: #333; 
          font-weight: 400;
        }
        
        .status { 
          padding: 6px 12px; 
          border-radius: 20px; 
          color: white; 
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
        }
        
        .status-pending { background-color: #ffc107; color: #333; }
        .status-confirmed { background-color: #17a2b8; }
        .status-preparing { background-color: #fd7e14; }
        .status-out_for_delivery { background-color: #6f42c1; }
        .status-delivered { background-color: #28a745; }
        .status-completed { background-color: #20c997; }
        .status-cancelled { background-color: #dc3545; }
        
        .price {
          font-size: 20px;
          font-weight: 700;
          color: #28a745;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        .delivery-box {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 10px 0;
        }
        
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Details</h1>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Company:</strong> VERCO DATA BASE</p>
      </div>
      
      <div class="section">
        <h2>Product Information</h2>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Product:</span>
            <span class="value">${order.productTitle}</span>
          </div>
          <div class="info-row">
            <span class="label">Category:</span>
            <span class="value">${order.category} ${order.subcategory ? `- ${order.subcategory}` : ''}</span>
          </div>
          <div class="info-row">
            <span class="label">Price:</span>
            <span class="value">RWF ${order.productPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
          <div class="info-row">
            <span class="label">Quantity:</span>
            <span class="value">${order.quantity} ${order.quantity === 1 ? 'item' : 'items'}</span>
          </div>
          <div class="info-row">
            <span class="label">Total Amount:</span>
            <span class="value price">RWF ${(order.productPrice * order.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
          <div class="info-row">
            <span class="label">Status:</span>
            <span class="value">
              <span class="status status-${order.status}">${order.status}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Order Date:</span>
            <span class="value">${new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Customer Information</h2>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">${order.userName}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${order.userEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Phone:</span>
            <span class="value">${order.customerPhone || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Payment Method:</span>
            <span class="value">${order.paymentMethod ? order.paymentMethod.replace('_', ' ').toUpperCase() : 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Delivery Information</h2>
        <div class="delivery-box">
          <div class="info-row">
            <span class="label">Address:</span>
            <span class="value">${order.deliveryAddress || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Village:</span>
            <span class="value">${order.village || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Instructions:</span>
            <span class="value">${order.deliveryInstructions || 'No special instructions'}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Order Summary</h2>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Subtotal:</span>
            <span class="value">RWF ${order.productPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
          <div class="info-row">
            <span class="label">Delivery Fee:</span>
            <span class="value">RWF 0</span>
          </div>
          <div class="info-row">
            <span class="label">Total Amount:</span>
            <span class="value price">RWF ${order.productPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
          <div class="info-row">
            <span class="label">Payment Status:</span>
            <span class="value">
              <span class="status status-${order.status}">${order.status}</span>
            </span>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>This is an official order document from VERCO DATA BASE</p>
        <p>For any questions, please contact our customer service</p>
        <p>Page 1 of 1</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for the content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  } else {
    // Fallback to download as HTML file if popup is blocked
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `order_${order.id}_${order.productTitle.replace(/[^a-zA-Z0-9]/g, '_')}.html`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const downloadOrderAsJSON = (order: Order) => {
  const orderData = {
    orderDetails: {
      id: order.id,
      productTitle: order.productTitle,
      productPrice: order.productPrice,
      category: order.category,
      subcategory: order.subcategory,
      status: order.status,
      createdAt: order.createdAt,
    },
    customerDetails: {
      name: order.userName,
      email: order.userEmail,
      phone: order.customerPhone,
      paymentMethod: order.paymentMethod,
    },
    deliveryDetails: {
      address: order.deliveryAddress,
      village: order.village,
      instructions: order.deliveryInstructions,
    },
    generatedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(orderData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `order_${order.id}_${order.productTitle.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
