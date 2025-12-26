import { APIIntegration, APIAction, APITrigger, APICredential, RetryPolicy } from '../types/advanced';
import { ShopifyClient, shopifyActions } from './integrations/shopify';

// ============= REAL API INTEGRATIONS =============

export const API_INTEGRATIONS: APIIntegration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payment',
    icon: '💳',
    description: 'Payment processing, subscriptions, and billing',
    connected: false,
    baseUrl: 'https://api.stripe.com/v1',
    authType: 'bearer_token',
    documentation: 'https://stripe.com/docs/api',
    rateLimits: {
      requestsPerSecond: 25,
      requestsPerHour: 10000
    },
    actions: [
      {
        id: 'stripe_create_customer',
        name: 'Create Customer',
        description: 'Create a new customer in Stripe',
        method: 'POST',
        endpoint: '/customers',
        requiresAuth: true,
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'Customer email address' },
          { name: 'name', type: 'string', required: false, description: 'Customer name' },
          { name: 'description', type: 'string', required: false, description: 'Customer description' },
          { name: 'metadata', type: 'object', required: false, description: 'Additional metadata' }
        ]
      },
      {
        id: 'stripe_create_payment_intent',
        name: 'Create Payment Intent',
        description: 'Create a payment intent for processing payments',
        method: 'POST',
        endpoint: '/payment_intents',
        requiresAuth: true,
        parameters: [
          { name: 'amount', type: 'number', required: true, description: 'Amount in cents' },
          { name: 'currency', type: 'string', required: true, description: 'Three-letter ISO currency code', default: 'usd' },
          { name: 'customer', type: 'string', required: false, description: 'Customer ID' }
        ]
      },
      {
        id: 'stripe_get_invoices',
        name: 'List Invoices',
        description: 'Retrieve list of invoices',
        method: 'GET',
        endpoint: '/invoices',
        requiresAuth: true,
        parameters: [
          { name: 'customer', type: 'string', required: false, description: 'Filter by customer' },
          { name: 'status', type: 'string', required: false, description: 'Filter by status', enum: ['draft', 'open', 'paid', 'uncollectible', 'void'] },
          { name: 'limit', type: 'number', required: false, description: 'Number of results', default: 10 }
        ]
      }
    ],
    triggers: [
      {
        id: 'stripe_payment_succeeded',
        name: 'Payment Succeeded',
        description: 'Triggered when a payment is successful',
        type: 'webhook',
        webhookPath: '/webhooks/stripe/payment_succeeded'
      },
      {
        id: 'stripe_subscription_canceled',
        name: 'Subscription Canceled',
        description: 'Triggered when a subscription is canceled',
        type: 'webhook',
        webhookPath: '/webhooks/stripe/subscription_canceled'
      }
    ]
  },

  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'Communication',
    icon: '📧',
    description: 'Email delivery and marketing platform',
    connected: false,
    baseUrl: 'https://api.sendgrid.com/v3',
    authType: 'bearer_token',
    documentation: 'https://docs.sendgrid.com/api-reference',
    actions: [
      {
        id: 'sendgrid_send_email',
        name: 'Send Email',
        description: 'Send transactional or marketing email',
        method: 'POST',
        endpoint: '/mail/send',
        requiresAuth: true,
        requestBody: [
          { name: 'from_email', type: 'string', required: true, description: 'Sender email' },
          { name: 'from_name', type: 'string', required: false, description: 'Sender name' },
          { name: 'to_email', type: 'string', required: true, description: 'Recipient email' },
          { name: 'to_name', type: 'string', required: false, description: 'Recipient name' },
          { name: 'subject', type: 'string', required: true, description: 'Email subject' },
          { name: 'html_content', type: 'string', required: true, description: 'HTML email body' },
          { name: 'text_content', type: 'string', required: false, description: 'Plain text email body' }
        ],
        parameters: []
      }
    ],
    triggers: []
  },

  {
    id: 'twilio',
    name: 'Twilio',
    category: 'Communication',
    icon: '📱',
    description: 'SMS, voice, and WhatsApp messaging',
    connected: false,
    baseUrl: 'https://api.twilio.com/2010-04-01',
    authType: 'basic_auth',
    documentation: 'https://www.twilio.com/docs/usage/api',
    actions: [
      {
        id: 'twilio_send_sms',
        name: 'Send SMS',
        description: 'Send an SMS message',
        method: 'POST',
        endpoint: '/Accounts/{AccountSid}/Messages.json',
        requiresAuth: true,
        parameters: [
          { name: 'To', type: 'string', required: true, description: 'Phone number to send to (E.164 format)' },
          { name: 'From', type: 'string', required: true, description: 'Your Twilio phone number' },
          { name: 'Body', type: 'string', required: true, description: 'Message content (max 1600 chars)' }
        ]
      },
      {
        id: 'twilio_send_whatsapp',
        name: 'Send WhatsApp Message',
        description: 'Send a WhatsApp message',
        method: 'POST',
        endpoint: '/Accounts/{AccountSid}/Messages.json',
        requiresAuth: true,
        parameters: [
          { name: 'To', type: 'string', required: true, description: 'WhatsApp number (format: whatsapp:+15551234567)' },
          { name: 'From', type: 'string', required: true, description: 'Your Twilio WhatsApp number' },
          { name: 'Body', type: 'string', required: true, description: 'Message content' }
        ]
      }
    ],
    triggers: [
      {
        id: 'twilio_incoming_sms',
        name: 'Incoming SMS',
        description: 'Triggered when an SMS is received',
        type: 'webhook',
        webhookPath: '/webhooks/twilio/sms'
      }
    ]
  },

  {
    id: 'shopify',
    name: 'Shopify',
    category: 'E-commerce',
    icon: '🛍️',
    description: 'E-commerce platform for online stores',
    connected: false,
    baseUrl: 'https://{shop_name}.myshopify.com/admin/api/2024-01',
    authType: 'oauth2',
    documentation: 'https://shopify.dev/docs/api/admin-rest',
    actions: Object.values(shopifyActions),
    triggers: [
      {
        id: 'shopify_order_created',
        name: 'Order Created',
        description: 'Triggered when a new order is placed',
        type: 'webhook',
        webhookPath: '/webhooks/shopify/orders/create'
      },
      {
        id: 'shopify_order_updated',
        name: 'Order Updated',
        description: 'Triggered when an order is updated',
        type: 'webhook',
        webhookPath: '/webhooks/shopify/orders/update'
      },
      {
        id: 'shopify_checkout_abandoned',
        name: 'Checkout Abandoned',
        description: 'Triggered when a checkout is abandoned',
        type: 'webhook',
        webhookPath: '/webhooks/shopify/checkouts/create'
      },
      {
        id: 'shopify_product_created',
        name: 'Product Created',
        description: 'Triggered when a product is created',
        type: 'webhook',
        webhookPath: '/webhooks/shopify/products/create'
      },
      {
        id: 'shopify_customer_created',
        name: 'Customer Created',
        description: 'Triggered when a customer is created',
        type: 'webhook',
        webhookPath: '/webhooks/shopify/customers/create'
      }
    ]
  },

  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    icon: '🎯',
    description: 'CRM and marketing automation platform',
    connected: false,
    baseUrl: 'https://api.hubapi.com',
    authType: 'oauth2',
    documentation: 'https://developers.hubspot.com/docs/api/overview',
    actions: [
      {
        id: 'hubspot_create_contact',
        name: 'Create Contact',
        description: 'Create a new contact in HubSpot',
        method: 'POST',
        endpoint: '/crm/v3/objects/contacts',
        requiresAuth: true,
        requestBody: [
          { name: 'email', type: 'string', required: true, description: 'Contact email' },
          { name: 'firstname', type: 'string', required: false, description: 'First name' },
          { name: 'lastname', type: 'string', required: false, description: 'Last name' },
          { name: 'company', type: 'string', required: false, description: 'Company name' }
        ],
        parameters: []
      },
      {
        id: 'hubspot_search_contacts',
        name: 'Search Contacts',
        description: 'Search for contacts using filters',
        method: 'POST',
        endpoint: '/crm/v3/objects/contacts/search',
        requiresAuth: true,
        parameters: []
      }
    ],
    triggers: []
  },

  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    icon: '💬',
    description: 'Team communication and collaboration',
    connected: false,
    baseUrl: 'https://slack.com/api',
    authType: 'bearer_token',
    documentation: 'https://api.slack.com/methods',
    actions: [
      {
        id: 'slack_post_message',
        name: 'Post Message',
        description: 'Send a message to a channel or user',
        method: 'POST',
        endpoint: '/chat.postMessage',
        requiresAuth: true,
        requestBody: [
          { name: 'channel', type: 'string', required: true, description: 'Channel ID or name' },
          { name: 'text', type: 'string', required: true, description: 'Message text' },
          { name: 'username', type: 'string', required: false, description: 'Bot username to display' },
          { name: 'thread_ts', type: 'string', required: false, description: 'Thread timestamp for replies' }
        ],
        parameters: []
      }
    ],
    triggers: [
      {
        id: 'slack_message_received',
        name: 'Message Received',
        description: 'Triggered when a message is posted',
        type: 'webhook',
        webhookPath: '/webhooks/slack/message'
      }
    ]
  },

  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    icon: '📝',
    description: 'Knowledge base and project management',
    connected: false,
    baseUrl: 'https://api.notion.com/v1',
    authType: 'bearer_token',
    documentation: 'https://developers.notion.com/reference/intro',
    actions: [
      {
        id: 'notion_create_page',
        name: 'Create Page',
        description: 'Create a new page in a database',
        method: 'POST',
        endpoint: '/pages',
        requiresAuth: true,
        requestBody: [
          { name: 'parent_database_id', type: 'string', required: true, description: 'Parent database ID' },
          { name: 'title', type: 'string', required: true, description: 'Page title' },
          { name: 'content', type: 'string', required: false, description: 'Page content (Markdown)' }
        ],
        parameters: []
      },
      {
        id: 'notion_query_database',
        name: 'Query Database',
        description: 'Query a Notion database',
        method: 'POST',
        endpoint: '/databases/{database_id}/query',
        requiresAuth: true,
        parameters: []
      }
    ],
    triggers: []
  },

  {
    id: 'airtable',
    name: 'Airtable',
    category: 'Database',
    icon: '📊',
    description: 'Cloud database and spreadsheet platform',
    connected: false,
    baseUrl: 'https://api.airtable.com/v0',
    authType: 'bearer_token',
    documentation: 'https://airtable.com/developers/web/api/introduction',
    actions: [
      {
        id: 'airtable_create_record',
        name: 'Create Record',
        description: 'Create a new record in a table',
        method: 'POST',
        endpoint: '/{base_id}/{table_name}',
        requiresAuth: true,
        requestBody: [
          { name: 'fields', type: 'object', required: true, description: 'Record fields as key-value pairs' }
        ],
        parameters: []
      },
      {
        id: 'airtable_list_records',
        name: 'List Records',
        description: 'Retrieve records from a table',
        method: 'GET',
        endpoint: '/{base_id}/{table_name}',
        requiresAuth: true,
        parameters: [
          { name: 'maxRecords', type: 'number', required: false, description: 'Maximum number of records', default: 100 },
          { name: 'filterByFormula', type: 'string', required: false, description: 'Airtable formula to filter results' }
        ]
      }
    ],
    triggers: []
  },

  {
    id: 'openai',
    name: 'OpenAI',
    category: 'AI',
    icon: '🤖',
    description: 'GPT models and AI capabilities',
    connected: false,
    baseUrl: 'https://api.openai.com/v1',
    authType: 'bearer_token',
    documentation: 'https://platform.openai.com/docs/api-reference',
    actions: [
      {
        id: 'openai_chat_completion',
        name: 'Create Chat Completion',
        description: 'Generate AI response using GPT models',
        method: 'POST',
        endpoint: '/chat/completions',
        requiresAuth: true,
        requestBody: [
          { name: 'model', type: 'string', required: true, description: 'Model to use', default: 'gpt-4o', enum: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
          { name: 'messages', type: 'array', required: true, description: 'Array of message objects' },
          { name: 'temperature', type: 'number', required: false, description: 'Sampling temperature (0-2)', default: 0.7 },
          { name: 'max_tokens', type: 'number', required: false, description: 'Maximum tokens to generate' }
        ],
        parameters: []
      },
      {
        id: 'openai_image_generation',
        name: 'Generate Image',
        description: 'Create images with DALL-E',
        method: 'POST',
        endpoint: '/images/generations',
        requiresAuth: true,
        requestBody: [
          { name: 'prompt', type: 'string', required: true, description: 'Image description' },
          { name: 'model', type: 'string', required: false, description: 'Model to use', default: 'dall-e-3' },
          { name: 'size', type: 'string', required: false, description: 'Image size', default: '1024x1024', enum: ['1024x1024', '1792x1024', '1024x1792'] }
        ],
        parameters: []
      }
    ],
    triggers: []
  }
];

// ============= DEFAULT RETRY POLICY =============

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffType: 'exponential',
  initialDelay: 1000, // 1 second
  maxDelay: 32000, // 32 seconds
  backoffMultiplier: 2,
  retryableErrors: ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', '429', '500', '502', '503', '504'],
  timeout: 30000 // 30 seconds
};

// ============= API EXECUTOR WITH RETRY LOGIC =============

export class APIExecutor {
  private credential: APICredential | null = null;

  constructor(credential?: APICredential) {
    this.credential = credential || null;
  }

  async execute(
    integration: APIIntegration,
    action: APIAction,
    params: Record<string, any>,
    retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY
  ): Promise<any> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= retryPolicy.maxRetries) {
      try {
        return await this.executeRequest(integration, action, params, retryPolicy.timeout);
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error, retryPolicy.retryableErrors);

        if (!isRetryable || attempt >= retryPolicy.maxRetries) {
          throw error;
        }

        // Calculate delay with backoff
        const delay = this.calculateBackoff(attempt, retryPolicy);
        console.log(`Retry attempt ${attempt + 1}/${retryPolicy.maxRetries} after ${delay}ms`);

        await this.sleep(delay);
        attempt++;
      }
    }

    throw lastError || new Error('Unknown error during API execution');
  }

  private async executeRequest(
    integration: APIIntegration,
    action: APIAction,
    params: Record<string, any>,
    timeout: number
  ): Promise<any> {
    // Special handling for Shopify using ShopifyClient
    if (integration.id === 'shopify' && this.credential) {
      return this.executeShopifyRequest(action, params);
    }

    const url = `${integration.baseUrl}${action.endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add authentication
    if (action.requiresAuth && this.credential) {
      switch (integration.authType) {
        case 'bearer_token':
          headers['Authorization'] = `Bearer ${this.credential.credentials.accessToken || this.credential.credentials.apiKey}`;
          break;
        case 'api_key':
          headers['X-API-Key'] = this.credential.credentials.apiKey || '';
          break;
        case 'basic_auth':
          const auth = btoa(`${this.credential.credentials.username}:${this.credential.credentials.password}`);
          headers['Authorization'] = `Basic ${auth}`;
          break;
        case 'oauth2':
          headers['Authorization'] = `Bearer ${this.credential.credentials.accessToken}`;
          break;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: action.method,
        headers,
        body: action.method !== 'GET' ? JSON.stringify(params) : undefined,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeShopifyRequest(
    action: APIAction,
    params: Record<string, any>
  ): Promise<any> {
    if (!this.credential) {
      throw new Error('Shopify credentials not found');
    }

    const { shop, accessToken, apiKey, apiSecret } = this.credential.credentials;

    if (!shop || !accessToken) {
      throw new Error('Invalid Shopify credentials: shop and accessToken required');
    }

    const scopes = [
      'read_products',
      'write_products',
      'read_orders',
      'write_orders',
      'read_customers',
      'write_customers',
      'read_checkouts',
      'read_inventory',
      'write_inventory'
    ];

    const client = new ShopifyClient({
      shop,
      apiKey: apiKey || '',
      apiSecret: apiSecret || '',
      accessToken,
      scopes
    });

    // Map action ID to ShopifyClient method
    switch (action.id) {
      // Orders
      case 'shopify_get_orders':
        return client.getOrders(params);
      case 'shopify_get_order':
        return client.getOrder(params.orderId);
      case 'shopify_cancel_order':
        return client.cancelOrder(params.orderId, params.reason);
      case 'shopify_close_order':
        return client.closeOrder(params.orderId);

      // Products
      case 'shopify_get_products':
        return client.getProducts(params);
      case 'shopify_get_product':
        return client.getProduct(params.productId);
      case 'shopify_create_product':
        return client.createProduct(params);
      case 'shopify_update_product':
        return client.updateProduct(params.productId, params);
      case 'shopify_delete_product':
        return client.deleteProduct(params.productId);

      // Customers
      case 'shopify_get_customers':
        return client.getCustomers(params);
      case 'shopify_get_customer':
        return client.getCustomer(params.customerId);
      case 'shopify_search_customers':
        return client.searchCustomers(params.query);

      // Abandoned Checkouts
      case 'shopify_get_abandoned_checkouts':
        return client.getAbandonedCheckouts(params);

      // Inventory
      case 'shopify_get_inventory_level':
        return client.getInventoryLevel(params.inventoryItemId, params.locationId);
      case 'shopify_set_inventory_level':
        return client.setInventoryLevel(params.inventoryItemId, params.locationId, params.available);

      // Webhooks
      case 'shopify_create_webhook':
        return client.createWebhook(params.topic, params.address);
      case 'shopify_get_webhooks':
        return client.getWebhooks();
      case 'shopify_delete_webhook':
        return client.deleteWebhook(params.webhookId);

      default:
        throw new Error(`Unknown Shopify action: ${action.id}`);
    }
  }

  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    const errorCode = error.code || error.status?.toString() || '';
    return retryableErrors.some(code => errorCode.includes(code));
  }

  private calculateBackoff(attempt: number, policy: RetryPolicy): number {
    let delay: number;

    switch (policy.backoffType) {
      case 'exponential':
        delay = Math.min(
          policy.initialDelay * Math.pow(policy.backoffMultiplier, attempt),
          policy.maxDelay
        );
        break;
      case 'linear':
        delay = Math.min(
          policy.initialDelay * (attempt + 1),
          policy.maxDelay
        );
        break;
      case 'constant':
      default:
        delay = policy.initialDelay;
    }

    // Add jitter (randomness) to prevent thundering herd
    return delay * (0.5 + Math.random() * 0.5);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============= HELPER FUNCTIONS =============

export function getIntegrationById(id: string): APIIntegration | undefined {
  return API_INTEGRATIONS.find(i => i.id === id);
}

export function getActionById(integrationId: string, actionId: string): APIAction | undefined {
  const integration = getIntegrationById(integrationId);
  return integration?.actions.find(a => a.id === actionId);
}

export function getIntegrationsByCategory(category: string): APIIntegration[] {
  return API_INTEGRATIONS.filter(i => i.category === category);
}
