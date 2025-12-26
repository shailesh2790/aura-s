# Shopify Integration Guide for AURA Automate

## Quick Start (5 minutes)

### 1. Prerequisites

- A Shopify store (development or production)
- Shopify Partners account (free) - [Sign up here](https://partners.shopify.com/)
- AURA Automate account

### 2. Create Shopify App

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Click **Apps** → **Create app** → **Create app manually**
3. Enter app name: "AURA Automate"
4. Click **Create app**

### 3. Configure App Settings

1. Click **Configuration** in left sidebar
2. Under **App URL**, enter: `http://localhost:3002` (for local development)
3. Under **Allowed redirection URL(s)**, add: `http://localhost:3002/auth/shopify/callback`
4. Click **Save**

### 4. Get API Credentials

1. Click **API credentials** in left sidebar
2. Copy **API key** (also called Client ID)
3. Click **Show** next to **API secret key** and copy it
4. Keep these safe - you'll need them in AURA!

### 5. Install App on Your Store

1. Click **Test on development store** (or select existing store)
2. If you don't have a development store:
   - Click **Create a development store**
   - Fill in store details
   - Click **Create**
3. Click **Install app**
4. Grant all requested permissions

### 6. Connect in AURA Automate

1. Open AURA Automate: `http://localhost:3002`
2. Navigate to **Integrations** tab (top navigation)
3. Find **Shopify** in the E-commerce category
4. Click **Connect**
5. Enter your information:
   - **Store URL**: `your-store.myshopify.com` (or just `your-store`)
   - **API Key**: Paste the API key from step 4
   - **API Secret**: Paste the API secret from step 4
6. Click **Connect to Shopify**
7. You'll be redirected to Shopify - click **Install**
8. Configure webhooks (optional but recommended):
   - Select webhook topics: `orders/create`, `checkouts/create`, `products/update`
   - Enter webhook URL: Your public URL (use ngrok for local development)
   - Click **Create Webhooks** or **Skip Webhooks**
9. Click **Complete Setup**

### 7. Test the Integration

#### Option A: Use Quick Start Template
1. Go to **Templates** tab
2. Find **"Shopify Quick Start"** template
3. Click **Use Template**
4. Click **Generate Workflow**
5. Once generated, click **Run Simulation**
6. Watch as it fetches your recent orders!

#### Option B: Create Custom Workflow
1. Go to **Builder** tab
2. Enter this prompt:
```
Fetch my last 5 orders from Shopify and show me:
- Order IDs
- Customer names
- Total amounts
- Order status
```
3. Click **Generate Workflow with AI**
4. Review the generated workflow
5. Click **Run Simulation**

## Available Shopify Actions

AURA Automate supports all major Shopify operations:

### Orders
- `shopify_get_orders` - Fetch orders list
- `shopify_get_order` - Get single order details
- `shopify_cancel_order` - Cancel an order
- `shopify_close_order` - Close an order

### Products
- `shopify_get_products` - List all products
- `shopify_get_product` - Get product details
- `shopify_create_product` - Create new product
- `shopify_update_product` - Update existing product
- `shopify_delete_product` - Delete product

### Customers
- `shopify_get_customers` - List customers
- `shopify_get_customer` - Get customer details
- `shopify_search_customers` - Search by query

### Abandoned Checkouts
- `shopify_get_abandoned_checkouts` - Fetch abandoned carts

### Inventory
- `shopify_get_inventory_level` - Check inventory
- `shopify_set_inventory_level` - Update inventory

### Webhooks
- `shopify_create_webhook` - Set up webhook
- `shopify_get_webhooks` - List webhooks
- `shopify_delete_webhook` - Remove webhook

## Example Workflows

### 1. Order Notification to Slack
```
When a new order is created in Shopify:
1. Get order details
2. Format a nice message
3. Send to Slack #orders channel
```

### 2. Abandoned Cart Recovery
```
When checkout is abandoned:
1. Get customer email and cart details
2. Wait 1 hour
3. Generate personalized email with AI
4. Send via SendGrid
5. If still abandoned after 24h, send SMS
```

### 3. Low Inventory Alert
```
Every day at 9am:
1. Get all products from Shopify
2. Check inventory levels
3. Filter products with < 10 units
4. Send email summary to purchasing team
```

### 4. Product Sync to Database
```
When product is created or updated:
1. Get product data from webhook
2. Transform to internal format
3. Upsert to PostgreSQL database
4. Log to Airtable for analytics
```

## Webhooks Setup

For real-time workflows, configure webhooks:

### Local Development (using ngrok)
1. Install ngrok: `npm install -g ngrok`
2. Start ngrok tunnel: `ngrok http 3001`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. In Shopify setup, use: `https://abc123.ngrok.io/webhooks/shopify/orders_create`

### Production Deployment
Use your production URL:
- Vercel: `https://your-app.vercel.app/webhooks/shopify/orders_create`
- Railway: `https://your-app.railway.app/webhooks/shopify/orders_create`

### Supported Webhook Topics
- `orders/create` - New order placed
- `orders/updated` - Order modified
- `checkouts/create` - Cart abandoned
- `products/create` - New product added
- `products/update` - Product modified
- `customers/create` - New customer
- `customers/update` - Customer modified

## Troubleshooting

### Error: "OAuth state not found"
**Solution**: Make sure you complete the OAuth flow without refreshing the page. Try connecting again.

### Error: "Invalid API credentials"
**Solution**: Double-check your API key and secret. Make sure you copied them correctly from Shopify Partners dashboard.

### Error: "Shop not found"
**Solution**: Ensure your store URL is correct. Use format: `your-store.myshopify.com`

### Error: "Insufficient permissions"
**Solution**: Reinstall the app and grant all requested permissions.

### Orders not appearing in workflow
**Solution**:
1. Check your store has orders (use test orders in development stores)
2. Verify credentials are saved correctly
3. Check execution logs for API errors

### Rate Limiting
Shopify limits:
- **Standard**: 2 requests/second
- **Plus**: 4 requests/second

AURA automatically handles rate limits with retry logic and exponential backoff.

## API Scopes Used

AURA requests these Shopify permissions:
- `read_products` - View products
- `write_products` - Create/update products
- `read_orders` - View orders
- `write_orders` - Modify orders
- `read_customers` - View customers
- `write_customers` - Create/update customers
- `read_checkouts` - View abandoned carts
- `read_inventory` - Check stock levels
- `write_inventory` - Update inventory

## Security Notes

- API credentials are encrypted at rest
- Access tokens are stored securely in your browser's IndexedDB
- OAuth2 flow uses state parameter for CSRF protection
- Webhook signatures are verified (HMAC-SHA256)
- No sensitive data is logged

## Need Help?

- **Documentation**: [Shopify API Docs](https://shopify.dev/docs/api/admin-rest)
- **AURA Support**: Open an issue on GitHub
- **Shopify Support**: [partners.shopify.com/support](https://partners.shopify.com/support)

## Next Steps

Once Shopify is connected, try:

1. **Combine with SendGrid**: Automated order confirmation emails
2. **Connect to Stripe**: Payment processing workflows
3. **Add Slack**: Real-time order notifications
4. **Use MCP Tools**: File system operations for reports

Happy automating! 🚀
