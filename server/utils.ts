// Helper functions to transform data

// Handle PostgreSQL boolean (true/false from JSON) vs integer (0/1)
const toBool = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  return val === true || val === 1 || val === 'true' || val === '1';
};

export const transformCustomer = (customer: any) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    address: customer.address || '',
    notes: customer.notes || '',
    status: customer.status || 'active',
    totalOrders: customer.total_orders || 0,
    totalSpent: customer.total_spent || 0,
    lastVisit: customer.last_visit || null,
    loyaltyPoints: customer.loyalty_points || 0,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at
});

export const transformOperation = (operation: any) => ({
    id: operation.id,
    customerId: operation.customer_id,
    ticketNumber: operation.ticket_number || null,
    status: operation.status || 'pending',
    workflowStatus: operation.workflow_status || 'pending',
    paymentStatus: operation.payment_status || 'unpaid',
    totalAmount: Number(operation.total_amount) || 0,
    paidAmount: Number(operation.paid_amount) || 0,
    paymentMethod: operation.payment_method || operation.resolved_payment_method || null,
    discount: Number(operation.discount) || 0,
    notes: operation.notes || '',
    promisedDate: operation.promised_date || null,
    pickedUpAt: operation.picked_up_at || null,
    pickedUpByName: operation.picked_up_by_name || null,
    pickedUpByPhone: operation.picked_up_by_phone || null,
    createdAt: operation.created_at,
    updatedAt: operation.updated_at,
    isNoCharge: toBool(operation.is_no_charge),
    isDoOver: toBool(operation.is_do_over),
    isDelivery: toBool(operation.is_delivery),
    isPickup: toBool(operation.is_pickup),
    customer: operation.customer_id ? {
        id: operation.customer_id,
        name: operation.customer_name,
        phone: operation.customer_phone,
        accountBalance: Number(operation.account_balance) || 0,
    } : null,
    createdBy: operation.created_by || null,
    staffName: operation.staff_name || null,
    shoes: operation.shoes || [],
    pickupEvents: Array.isArray(operation.pickupEvents)
        ? operation.pickupEvents.map((event: any) => ({
            id: event.id,
            collectorName: event.collector_name || null,
            collectorPhone: event.collector_phone || null,
            pickedUpAt: event.picked_up_at || null,
            shoes: Array.isArray(event.shoes) ? event.shoes : [],
        }))
        : [],
    retailItems: operation.retailItems || [],
    paymentRecords: operation.paymentRecords || [],
    generatedDocumentId: operation.generatedDocumentId || null,
    generatedDocumentType: operation.generatedDocumentType || null
});

export const transformService = (service: any) => ({
    id: service.id,
    name: service.name,
    description: service.description || '',
    price: service.price || 0,
    pricingMode: service.pricing_mode || 'fixed',
    minPrice: service.min_price !== null && service.min_price !== undefined ? Number(service.min_price) : null,
    maxPrice: service.max_price !== null && service.max_price !== undefined ? Number(service.max_price) : null,
    unitLabel: service.unit_label || '',
    priceNote: service.price_note || '',
    estimatedDays: service.estimated_days || 1,
    category: service.category || '',
    status: service.status || 'active',
    createdAt: service.created_at,
    updatedAt: service.updated_at
});
