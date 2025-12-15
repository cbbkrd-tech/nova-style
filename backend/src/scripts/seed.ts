import { ExecArgs } from '@medusajs/framework/types';
import {
  createProductsWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  createStockLocationsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
} from '@medusajs/medusa/core-flows';

export default async function seedNovaStyle({ container }: ExecArgs) {
  const logger = container.resolve('logger');

  logger.info('Seeding Nova-Style store...');

  // Create Sales Channel
  const { result: salesChannelResult } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: 'BLK/OUT Storefront',
          description: 'Main sales channel',
        },
      ],
    },
  });
  const salesChannel = salesChannelResult[0];
  logger.info(`Created sales channel: ${salesChannel.name}`);

  // Create Region (Poland with PLN)
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: 'Poland',
          currency_code: 'pln',
          countries: ['pl'],
          payment_providers: [],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info(`Created region: ${region.name}`);

  // Create Stock Location
  const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: 'BLK/OUT Warehouse',
          address: {
            address_1: 'Marszałkowska 1',
            city: 'Warsaw',
            country_code: 'pl',
            postal_code: '00-001',
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];
  logger.info(`Created stock location: ${stockLocation.name}`);

  // Link Sales Channel to Stock Location
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
    },
  });

  // Create Shipping Profile
  const { result: shippingProfileResult } = await createShippingProfilesWorkflow(container).run({
    input: {
      data: [
        {
          name: 'Default Shipping',
          type: 'default',
        },
      ],
    },
  });
  const shippingProfile = shippingProfileResult[0];

  // Create Product Categories
  const { result: categoryResult } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        {
          name: 'Kobiety',
          handle: 'women',
          is_active: true,
        },
        {
          name: 'Mężczyźni',
          handle: 'men',
          is_active: true,
        },
      ],
    },
  });
  logger.info(`Created ${categoryResult.length} categories`);

  const womenCategory = categoryResult.find((c) => c.handle === 'women');
  const menCategory = categoryResult.find((c) => c.handle === 'men');

  // Products data - 8 products from uploaded images
  const products = [
    // Women (4 products)
    {
      title: 'DRES KHAKI',
      handle: 'dres-khaki',
      category: 'women',
      color: 'KHAKI',
      price: 44900, // 449 PLN in groszy
      image: '/images/products/dres-khaki-kobieta.png',
    },
    {
      title: 'SZARA BLUZA',
      handle: 'szara-bluza',
      category: 'women',
      color: 'SZARY',
      price: 24900,
      image: '/images/products/szara-bluza-kobieta.png',
    },
    {
      title: 'DRES GRAFITOWY',
      handle: 'dres-grafitowy',
      category: 'women',
      color: 'GRAFITOWY',
      price: 39900,
      image: '/images/products/dres-grafitowy-kobieta.png',
    },
    {
      title: 'TSHIRT CZARNY',
      handle: 'tshirt-czarny-women',
      category: 'women',
      color: 'CZARNY',
      price: 13900,
      image: '/images/products/tshirt-czarny-kobieta.png',
    },
    // Men (4 products)
    {
      title: 'DRES CZARNY',
      handle: 'dres-czarny',
      category: 'men',
      color: 'CZARNY',
      price: 44900,
      image: '/images/products/dres-czarny-mezczyzna.png',
    },
    {
      title: 'KURTKA JEANSOWA CZARNA',
      handle: 'kurtka-jeansowa-czarna',
      category: 'men',
      color: 'CZARNY',
      price: 32900,
      image: '/images/products/kurtka-jeansowa-mezczyzna.jpg',
    },
    {
      title: 'TSHIRT CZARNY',
      handle: 'tshirt-czarny-men',
      category: 'men',
      color: 'CZARNY',
      price: 14900,
      image: '/images/products/tshirt-czarny-mezczyzna.png',
    },
    {
      title: 'BLUZA KHAKI',
      handle: 'bluza-khaki',
      category: 'men',
      color: 'KHAKI',
      price: 27900,
      image: '/images/products/bluza-khaki-mezczyzna.jpg',
    },
  ];

  // Create products
  const { result: productResult } = await createProductsWorkflow(container).run({
    input: {
      products: products.map((p) => ({
        title: p.title,
        handle: p.handle,
        status: 'published' as const,
        shipping_profile_id: shippingProfile.id,
        category_ids: [p.category === 'women' ? womenCategory!.id : menCategory!.id],
        sales_channels: [{ id: salesChannel.id }],
        images: [{ url: p.image }],
        thumbnail: p.image,
        metadata: {
          category: p.category,
          color: p.color,
          subCategory: p.category === 'women' ? 'KOBIETY' : 'MĘŻCZYŹNI',
        },
        options: [
          {
            title: 'Rozmiar',
            values: ['XS', 'S', 'M', 'L', 'XL'],
          },
        ],
        variants: [
          {
            title: 'XS',
            sku: `${p.handle}-xs`,
            manage_inventory: true,
            prices: [{ amount: p.price, currency_code: 'pln' }],
            options: { Rozmiar: 'XS' },
          },
          {
            title: 'S',
            sku: `${p.handle}-s`,
            manage_inventory: true,
            prices: [{ amount: p.price, currency_code: 'pln' }],
            options: { Rozmiar: 'S' },
          },
          {
            title: 'M',
            sku: `${p.handle}-m`,
            manage_inventory: true,
            prices: [{ amount: p.price, currency_code: 'pln' }],
            options: { Rozmiar: 'M' },
          },
          {
            title: 'L',
            sku: `${p.handle}-l`,
            manage_inventory: true,
            prices: [{ amount: p.price, currency_code: 'pln' }],
            options: { Rozmiar: 'L' },
          },
          {
            title: 'XL',
            sku: `${p.handle}-xl`,
            manage_inventory: true,
            prices: [{ amount: p.price, currency_code: 'pln' }],
            options: { Rozmiar: 'XL' },
          },
        ],
      })),
    },
  });

  logger.info(`Created ${productResult.length} products`);
  logger.info('Nova-Style store seeded successfully!');
}
