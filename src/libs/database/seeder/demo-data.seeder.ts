import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../../common/enums/user-role.enum';
import { SecurityBcryptJsService } from '../../core/security';
import {
  CompanyEntity,
  InventoryEntity,
  ProductEntity,
  UserEntity,
  WarehouseEntity,
} from '../entity';
import {
  CompanyRepository,
  InventoryRepository,
  ProductRepository,
  UserRepository,
  WarehouseRepository,
} from '../repository';

@Injectable()
export class DemoDataSeeder {
  private readonly logger = new Logger(DemoDataSeeder.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly bcryptService: SecurityBcryptJsService,
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly productRepository: ProductRepository,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  async seed() {
    const enabled = this.configService.get<string>('DEMO_SEED_ENABLED');

    if (enabled !== 'true') {
      this.logger.log('Demo seed skipped');
      return;
    }

    const email =
      this.configService.get<string>('DEMO_COMPANY_EMAIL') ||
      'demo@opspilot.ai';

    const password =
      this.configService.get<string>('DEMO_COMPANY_PASSWORD') || 'Demo12345!';

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      this.logger.log('Demo data already exists');
      return;
    }

    const company = await this.companyRepository.createAndSaveItem({
      name: 'TopParts Manufacturing Demo',
      businessNumber: '123-45-67890',
      email,
      phone: '+82-10-1234-5678',
    } as Partial<CompanyEntity>);

    const hashedPassword = await this.bcryptService.hashPassword(password);

    await this.userRepository.createAndSaveItem({
      email,
      password: hashedPassword,
      name: 'Demo Company Admin',
      role: UserRole.COMPANY_ADMIN,
      companyId: company.id,
    } as Partial<UserEntity>);

    const warehouse = await this.warehouseRepository.createAndSaveItem({
      companyId: company.id,
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      location: 'Cheongju, South Korea',
    } as Partial<WarehouseEntity>);

    const products = await Promise.all([
      this.productRepository.createAndSaveItem({
        companyId: company.id,
        name: 'Industrial Motor A',
        sku: 'MOTOR-A-001',
        unit: 'EA',
        safetyStock: 20,
        description: 'High performance industrial motor',
      } as Partial<ProductEntity>),

      this.productRepository.createAndSaveItem({
        companyId: company.id,
        name: 'Control Sensor B',
        sku: 'SENSOR-B-001',
        unit: 'EA',
        safetyStock: 50,
        description: 'Factory control sensor',
      } as Partial<ProductEntity>),

      this.productRepository.createAndSaveItem({
        companyId: company.id,
        name: 'Hydraulic Pump C',
        sku: 'PUMP-C-001',
        unit: 'EA',
        safetyStock: 10,
        description: 'Hydraulic pump component',
      } as Partial<ProductEntity>),
    ]);

    await Promise.all([
      this.inventoryRepository.createAndSaveItem({
        companyId: company.id,
        warehouseId: warehouse.id,
        productId: products[0].id,
        quantity: 15,
      } as Partial<InventoryEntity>),

      this.inventoryRepository.createAndSaveItem({
        companyId: company.id,
        warehouseId: warehouse.id,
        productId: products[1].id,
        quantity: 120,
      } as Partial<InventoryEntity>),

      this.inventoryRepository.createAndSaveItem({
        companyId: company.id,
        warehouseId: warehouse.id,
        productId: products[2].id,
        quantity: 8,
      } as Partial<InventoryEntity>),
    ]);

    this.logger.log(`Demo data created. Login: ${email} / ${password}`);
  }
}