import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessPartnerRecommendation, BusinessProductRecommendation, CustomerRecommendation } from './interfaces/recommendation';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerRecommendations(customerId: string, numRecommendations: number): Promise<CustomerRecommendation[]> {
    if (!customerId || customerId.trim() === '') {
      throw new NotFoundException('Customer ID is required');
    }

    const customer = await this.prisma.user.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ID ${customerId} not found in database.`);
    }

    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        ratings: true,
      },
      take: Math.min(numRecommendations, 100),
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }],
    });

    return products.map((product) => ({
      ProductID: product.productId,
      Description: product.name,
      Category: product.category.name,
      UnitPrice: product.price,
      Score: product.rating || 0,
      RecommendationReason: `Based on ${customer.name}'s preferences and product popularity`,
    }));
  }

  async getBusinessRecommendations(
    businessName: string,
    numProductRecommendations: number,
    numPartnerRecommendations: number
  ): Promise<{
    productRecommendations: BusinessProductRecommendation[];
    partnerRecommendations: BusinessPartnerRecommendation[];
  }> {
    if (!businessName || businessName.trim() === '') {
      throw new NotFoundException('Business name is required');
    }

    const business = await this.prisma.user.findFirst({
      where: {
        name: { contains: businessName, mode: 'insensitive' },
        type: { in: ['EXPORTER', 'IMPORTER'] },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business name "${businessName}" not found in database.`);
    }

    const products = await this.prisma.product.findMany({
      where: {
        ownerId: { not: business.userId },
      },
      include: {
        category: true,
        owner: true,
      },
      take: Math.min(numProductRecommendations, 100),
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }],
    });

    const partners = await this.prisma.user.findMany({
      where: {
        userId: { not: business.userId },
        type: { in: ['EXPORTER', 'IMPORTER'] },
        active: true,
        industrySector: business.industrySector
          ? {
              contains: business.industrySector,
              mode: 'insensitive',
            }
          : undefined,
      },
      take: Math.min(numPartnerRecommendations, 50),
      orderBy: { createdAt: 'desc' },
    });

    return {
      productRecommendations: products.map((product) => ({
        ProductID: product.productId,
        Description: product.name,
        Category: product.category.name,
        UnitPrice: product.price,
        Score: product.rating || 0,
        RecommendationReason: `High demand product from ${product.owner.name}`,
      })),
      partnerRecommendations: partners.map((partner) => ({
        PartnerID: partner.userId,
        PartnerName: partner.name,
        Industry: partner.industrySector || 'General',
        Location: partner.country,
        Score: 0.85,
        PartnershipReason: `Similar industry focus: ${partner.industrySector || 'General'}`,
      })),
    };
  }

  convertToCSV(data: any, type: 'customer' | 'business'): string {
    if (type === 'customer') {
      return this.convertCustomerRecommendationsToCSV(data);
    } else {
      return this.convertBusinessRecommendationsToCSV(data);
    }
  }

  private convertCustomerRecommendationsToCSV(recommendations: CustomerRecommendation[]): string {
    const headers = ['ProductID', 'Description', 'Category', 'UnitPrice', 'Score', 'RecommendationReason'];
    const csvRows = [headers.join(',')];

    recommendations.forEach((rec) => {
      const row = [rec.ProductID, `"${rec.Description}"`, rec.Category, rec.UnitPrice.toString(), rec.Score.toString(), `"${rec.RecommendationReason}"`];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private convertBusinessRecommendationsToCSV(data: { productRecommendations: BusinessProductRecommendation[]; partnerRecommendations: BusinessPartnerRecommendation[] }): string {
    const csvRows: string[] = [];

    csvRows.push('PRODUCT RECOMMENDATIONS');
    const productHeaders = ['ProductID', 'Description', 'Category', 'UnitPrice', 'Score', 'RecommendationReason'];
    csvRows.push(productHeaders.join(','));

    data.productRecommendations.forEach((rec) => {
      const row = [rec.ProductID, `"${rec.Description}"`, rec.Category, rec.UnitPrice.toString(), rec.Score.toString(), `"${rec.RecommendationReason}"`];
      csvRows.push(row.join(','));
    });

    csvRows.push('');

    csvRows.push('PARTNER RECOMMENDATIONS');
    const partnerHeaders = ['PartnerID', 'PartnerName', 'Industry', 'Location', 'Score', 'PartnershipReason'];
    csvRows.push(partnerHeaders.join(','));

    data.partnerRecommendations.forEach((rec) => {
      const row = [rec.PartnerID, `"${rec.PartnerName}"`, rec.Industry, rec.Location, rec.Score.toString(), `"${rec.PartnershipReason}"`];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}
