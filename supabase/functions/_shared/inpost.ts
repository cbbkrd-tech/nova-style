// InPost ShipX API Integration

const INPOST_API_URL = 'https://api-shipx-pl.easypack24.net';
const ORGANIZATION_ID = 121981;

export interface InPostCredentials {
  token: string;
}

export interface InPostReceiverPaczkomat {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}

export interface InPostReceiverCourier {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  address: {
    street: string;
    building_number: string;
    city: string;
    post_code: string;
    country_code: string;
  };
}

export interface InPostShipmentRequest {
  receiver: InPostReceiverPaczkomat | InPostReceiverCourier;
  parcels: {
    template?: 'small' | 'medium' | 'large';
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'mm';
    };
    weight?: {
      amount: number;
      unit: 'kg';
    };
  };
  service: 'inpost_locker_standard' | 'inpost_courier_c2c';
  reference?: string;
  custom_attributes?: {
    target_point?: string; // Paczkomat code
    sending_method?: 'dispatch_order' | 'parcel_locker' | 'pop';
  };
  additional_services?: string[];
}

export interface InPostShipmentResponse {
  id: number;
  status: string;
  tracking_number: string | null;
  service: string;
  offers: Array<{
    id: number;
    status: string;
    rate: number | null;
    currency: string;
    service: {
      id: string;
      name: string;
    };
  }>;
}

export interface InPostLabelResponse {
  // Returns binary PDF data
}

// Create a shipment
export async function createInPostShipment(
  credentials: InPostCredentials,
  request: InPostShipmentRequest
): Promise<{ data?: InPostShipmentResponse; error?: string }> {
  try {
    const response = await fetch(
      `${INPOST_API_URL}/v1/organizations/${ORGANIZATION_ID}/shipments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('InPost API Error:', data);
      return { error: data.message || data.error || 'Failed to create shipment' };
    }

    return { data };
  } catch (error) {
    console.error('InPost API Exception:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Buy/confirm a shipment (creates tracking number)
export async function buyInPostShipment(
  credentials: InPostCredentials,
  shipmentId: number,
  offerId: number
): Promise<{ data?: InPostShipmentResponse; error?: string }> {
  try {
    const response = await fetch(
      `${INPOST_API_URL}/v1/shipments/${shipmentId}/buy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offerId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('InPost Buy Error:', data);
      return { error: data.message || data.error || 'Failed to buy shipment' };
    }

    return { data };
  } catch (error) {
    console.error('InPost Buy Exception:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get shipment offers
export async function getInPostOffers(
  credentials: InPostCredentials,
  shipmentId: number
): Promise<{ data?: InPostShipmentResponse; error?: string }> {
  try {
    const response = await fetch(
      `${INPOST_API_URL}/v1/shipments/${shipmentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('InPost Offers Error:', data);
      return { error: data.message || data.error || 'Failed to get offers' };
    }

    return { data };
  } catch (error) {
    console.error('InPost Offers Exception:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get label PDF
export async function getInPostLabel(
  credentials: InPostCredentials,
  shipmentId: number,
  format: 'pdf' | 'zpl' | 'epl' = 'pdf'
): Promise<{ data?: ArrayBuffer; error?: string }> {
  try {
    const response = await fetch(
      `${INPOST_API_URL}/v1/shipments/${shipmentId}/label?format=${format}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('InPost Label Error:', error);
      return { error: 'Failed to get label' };
    }

    const data = await response.arrayBuffer();
    return { data };
  } catch (error) {
    console.error('InPost Label Exception:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Create dispatch order (order courier pickup)
export async function createDispatchOrder(
  credentials: InPostCredentials,
  shipmentIds: number[],
  address: {
    street: string;
    building_number: string;
    city: string;
    post_code: string;
    country_code: string;
  },
  name: string,
  phone: string,
  email: string
): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(
      `${INPOST_API_URL}/v1/organizations/${ORGANIZATION_ID}/dispatch_orders`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipments: shipmentIds.map(id => String(id)),
          name,
          phone,
          email,
          address,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('InPost Dispatch Error:', data);
      return { error: data.message || data.error || 'Failed to create dispatch order' };
    }

    return { data };
  } catch (error) {
    console.error('InPost Dispatch Exception:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Sender info (store address)
export const NOVA_STYLE_SENDER = {
  company_name: 'Nova Style Karolina Syczewska',
  email: 'novastylebutik@gmail.com',
  phone: '000000000', // Will need to be updated with real phone
  address: {
    street: 'Konstruktorów',
    building_number: '6c/16',
    city: 'Nowa Sól',
    post_code: '67-100',
    country_code: 'PL',
  },
};
