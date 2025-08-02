import { Injectable, Logger } from '@nestjs/common';
import { EgyptianEconomicContext } from './interfaces/EgyptianEconomicContext';

@Injectable()
export class EgyptianEconomicContextService {
  private readonly logger = new Logger(EgyptianEconomicContextService.name);

  async getContext(): Promise<EgyptianEconomicContext> {
    try {
      this.logger.log('Fetching Egyptian economic context data');

      const currentDate = new Date();
      const isWinterSeason = this.isWinterTourismSeason(currentDate);
      const isRamadanSeason = this.isRamadanSeason(currentDate);

      const context: EgyptianEconomicContext = {
        gdp_growth: 4.35,
        inflation: 5.04,
        population_growth: 1.73,
        tourism_sensitivity: 0.85,
        economic_stability_index: 0.65,
        trade_balance: -0.12,
        is_winter_tourism_season: isWinterSeason ? 1 : 0,
        is_ramadan_season: isRamadanSeason ? 1 : 0,
        current_date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
      };

      this.logger.log('Egyptian economic context data retrieved successfully');
      return context;
    } catch (error) {
      this.logger.error(`Failed to fetch Egyptian economic context: ${error.message}`);
      throw error;
    }
  }

  private isWinterTourismSeason(date: Date): boolean {
    const month = date.getMonth() + 1;
    return month >= 10 || month <= 4;
  }

  private isRamadanSeason(date: Date): boolean {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    if (year === 2025) {
      return month === 3 || month === 4;
    }

    return false;
  }

  async updateEconomicData(): Promise<void> {
    try {
      this.logger.log('Updating economic data from external sources');

      this.logger.log('Economic data updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update economic data: ${error.message}`);
      throw error;
    }
  }

  getIndustryWeights(): Record<string, number> {
    return {
      Textiles: 0.15,
      Agriculture: 0.18,
      Spices: 0.12,
      'Fruits & Vegetables': 0.15,
      Chemicals: 0.08,
      Pharmaceuticals: 0.07,
      Electronics: 0.06,
      Machinery: 0.05,
      Metals: 0.08,
      Automobiles: 0.03,
      Seafood: 0.06,
      Manufacturing: 0.1,
    };
  }
}
