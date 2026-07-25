import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service.js';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe Webhook Endpoint' })
  handleStripeWebhook(@Body() body: any, @Headers('stripe-signature') signature: string) {
    return this.webhooksService.handleStripeWebhook(body, signature);
  }

  @Post('razorpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay Webhook Endpoint' })
  handleRazorpayWebhook(@Body() body: any, @Headers('x-razorpay-signature') signature: string) {
    return this.webhooksService.handleRazorpayWebhook(body, signature);
  }
}
