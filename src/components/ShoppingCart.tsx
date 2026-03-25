import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart,
  faTrash,
  faMinus,
  faPlus,
  faTimes,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function ShoppingCart() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeItem, updateQuantity, total, itemCount, clearCart } = useCart();
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleCheckout = () => {
    // Here you would typically integrate with a payment system
    setCheckoutSuccess(true);
    setTimeout(() => {
      clearCart();
      setCheckoutSuccess(false);
      setIsOpen(false);
    }, 2000);
  };

  const handleQuantityChange = (id: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity);
    } else {
      removeItem(id);
    }
  };

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-500 transition-colors duration-200"
      >
        <div className="relative">
          <FontAwesomeIcon icon={faShoppingCart} className="text-2xl" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </div>
      </button>

      {/* Cart Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-96 bg-gray-900 shadow-lg transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                  Shopping Cart
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    Your cart is empty
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-800 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <p className="text-gray-400">{formatCurrency(item.price)}</p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                            className="text-gray-400 hover:text-white"
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                            className="text-gray-400 hover:text-white"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-300 ml-2"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-medium">Total:</span>
                  <span className="text-white text-xl font-bold">
                    {formatCurrency(total)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={items.length === 0 || checkoutSuccess}
                  className={`w-full py-3 rounded-lg flex items-center justify-center space-x-2 ${
                    items.length === 0
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : checkoutSuccess
                      ? 'bg-green-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {checkoutSuccess ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Order Placed!</span>
                    </>
                  ) : (
                    <>
                      <span>Checkout</span>
                      {total > 0 && <span>({formatCurrency(total)})</span>}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
