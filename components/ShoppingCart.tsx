"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, ShoppingCart, CreditCard } from "lucide-react";
import Link from "next/link";
import CustomerDetailsForm, { CustomerDetails } from "@/components/CustomerDetailsForm";

interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
  category: string;
  subcategory?: string;
  image?: string;
}

export default function ShoppingCartComponent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Format price function for consistency with product pages
  const formatPrice = (price?: number | null) => {
    if (price == null) return "Price not set";
    return `RWF ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("shoppingCart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("shoppingCart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (event: any) => {
      const newItem = event.detail;
      setCartItems(prev => {
        const existingIndex = prev.findIndex(item => item.productId === newItem.productId);
        if (existingIndex > -1) {
          // Update existing item
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + newItem.quantity
          };
          return updated;
        } else {
          // Add new item
          return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
        }
      });
    };

    window.addEventListener('addToCart', handleCartUpdate);
    return () => {
      window.removeEventListener('addToCart', handleCartUpdate);
    };
  }, []);

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    const cartItem: CartItem = {
      ...item,
      id: Date.now().toString(),
      quantity: 1
    };
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(cartItem => cartItem.productId === item.productId);
      if (existingIndex > -1) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      } else {
        // Add new item
        return [...prev, cartItem];
      }
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("shoppingCart");
  };

  const checkout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    setShowCheckout(true);
  };

  const handleCustomerDetailsSubmit = async (customerDetails: CustomerDetails) => {
    setIsProcessing(true);
    
    try {
      // Create orders from cart items with customer details
      const orderPromises = cartItems.map(async (item) => {
        const orderData = {
          productId: item.productId,
          productTitle: item.productTitle,
          productPrice: item.productPrice,
          userId: null, // Guest order
          userName: `${customerDetails.firstName} ${customerDetails.lastName}`,
          userEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          deliveryAddress: `${customerDetails.address}, ${customerDetails.sector}, ${customerDetails.district}, ${customerDetails.province}`,
          village: customerDetails.village,
          deliveryInstructions: customerDetails.deliveryInstructions,
          paymentMethod: customerDetails.paymentMethod,
          category: item.category,
          subcategory: item.subcategory,
          status: "pending",
          createdAt: new Date().toISOString()
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const errorText = response.status === 500 ? 'Internal Server Error' : 
                           response.status === 400 ? 'Bad Request' : 
                           'Unknown error';
          console.error(`Failed to create order for ${item.productTitle}:`, errorText);
          return { success: false, error: `Failed to create order for ${item.productTitle}` };
        }

        const result = await response.json();
        return { success: true, result };
      });

      // Wait for all orders to be created
      const results = await Promise.all(orderPromises);
      
      // Check if all orders were created successfully
      const failedOrders = results.filter(result => !result.success);
      
      if (failedOrders.length > 0) {
        const failedItems = failedOrders.map(order => order.error || 'Unknown error').join(', ');
        throw new Error(`Some orders failed: ${failedItems}`);
      }
      
      clearCart();
      setShowCheckout(false);
      alert(`Order placed successfully! Your items will be delivered to ${customerDetails.address}, ${customerDetails.sector}, ${customerDetails.district}, ${customerDetails.province}. You will be contacted at ${customerDetails.phone} for confirmation.`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Cart Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-3 shadow-lg"
          size="sm"
        >
          <ShoppingCart className="h-5 w-5" />
          {getTotalItems() > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Cart Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <CardTitle className="text-lg font-semibold">Shopping Cart</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  ×
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                    <p className="text-gray-600">Add some products to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={`${item.productId}-${item.id}`} className="flex items-center space-x-4 p-3 border rounded-lg">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.productTitle}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.productTitle}</h4>
                          {item.subcategory && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {item.subcategory}
                            </Badge>
                          )}
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(item.productPrice)}
                          </p>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <span className="font-medium">{item.quantity}</span>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              
              {/* Cart Footer */}
              {cartItems.length > 0 && (
                <div className="border-t p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={clearCart}
                    >
                      Clear Cart
                    </Button>
                    
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={checkout}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCheckout(false)} />
          <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CustomerDetailsForm
              onSubmit={handleCustomerDetailsSubmit}
              onCancel={() => setShowCheckout(false)}
              loading={isProcessing}
            />
          </div>
        </div>
      )}
    </>
  );
}
