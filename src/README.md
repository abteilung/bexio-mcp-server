# @bexio/mcp-server

MCP server for Bexio accounting integration with Claude Desktop.

## Installation

### Via npx (recommended)
```bash
npx @bexio/mcp-server
```

### Global installation
```bash
npm install -g @bexio/mcp-server
bexio-mcp-server
```

### Claude Desktop Configuration
Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "bexio": {
      "command": "npx",
      "args": ["@bexio/mcp-server"],
      "env": {
        "BEXIO_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Environment Variables

- `BEXIO_API_TOKEN` (required): Your Bexio API token
- `BEXIO_BASE_URL` (optional): API base URL (default: https://api.bexio.com/2.0)

## Features

This MCP server provides 218 tools for Bexio integration:

- **Contacts & CRM**: Create, update, search contacts and relations
- **Invoices & Quotes**: Full invoice/quote lifecycle management
- **Banking**: Swiss QR-bill payments, IBAN validation
- **Projects**: Project management with time tracking
- **Accounting**: Manual entries, accounts, VAT periods
- **Purchase**: Bills, expenses, purchase orders
- **Files**: Document upload/download
- **Payroll**: Employee and absence management (requires Payroll module)

## HTTP Mode

For integration with n8n or other tools:
```bash
npx @bexio/mcp-server --mode http --port 8000
```

## License

MIT
