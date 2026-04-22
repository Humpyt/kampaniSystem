// Helper functions to transform data

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
    status: operation.status || 'pending',
    totalAmount: operation.total_amount || 0,
    paidAmount: operation.paid_amount || 0,
    discount: operation.discount || 0,
    notes: operation.notes || '',
    promisedDate: operation.promised_date || null,
    createdAt: operation.created_at,
    updatedAt: operation.updated_at,
    isNoCharge: Boolean(operation.is_no_charge),
    isDoOver: Boolean(operation.is_do_over),
    isDelivery: Boolean(operation.is_delivery),
    isPickup: Boolean(operation.is_pickup),
    customer: operation.customer_id ? {
        id: operation.customer_id,
        name: operation.customer_name,
        phone: operation.customer_phone
    } : null,
    createdBy: operation.created_by || null,
    staffName: operation.staff_name || null,
    shoes: operation.shoes || [],
    retailItems: operation.retailItems || [],
    generatedDocumentId: operation.generatedDocumentId || null,
    generatedDocumentType: operation.generatedDocumentType || null,
    ticketNumber: operation.ticket_number || null
});

export const transformService = (service: any) => ({
    id: service.id,
    name: service.name,
    description: service.description || '',
    price: service.price || 0,
    estimatedDays: service.estimated_days || 1,
    category: service.category || '',
    status: service.status || 'active',
    createdAt: service.created_at,
    updatedAt: service.updated_at
});
