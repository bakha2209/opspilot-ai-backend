import {
  DataSource,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  QueryRunner,
  Repository,
} from 'typeorm';

export abstract class OrmRepository<E extends ObjectLiteral> extends Repository<E> {
  protected constructor(
    protected readonly entityTarget: EntityTarget<E>,
    protected readonly dataSource: DataSource,
    protected readonly repositoryName = 'OrmRepository',
  ) {
    super(entityTarget, dataSource.createEntityManager());
  }

  protected getEntityManager(runner?: QueryRunner): EntityManager {
    return runner ? runner.manager : this.dataSource.createEntityManager();
  }

  async findItemOne(
    options: FindOneOptions<E>,
    runner?: QueryRunner,
  ): Promise<E | null> {
    const manager = this.getEntityManager(runner);
    return manager.getRepository(this.entityTarget).findOne(options);
  }

  async findItemMany(
    options: FindManyOptions<E>,
    runner?: QueryRunner,
  ): Promise<E[]> {
    const manager = this.getEntityManager(runner);
    return manager.getRepository(this.entityTarget).find(options);
  }

  async saveItem(entity: E, runner?: QueryRunner): Promise<E> {
    const manager = this.getEntityManager(runner);
    return manager.getRepository(this.entityTarget).save(entity);
  }

  async createAndSaveItem(payload: Partial<E>, runner?: QueryRunner): Promise<E> {
    const manager = this.getEntityManager(runner);
    const repository = manager.getRepository(this.entityTarget);
    const entity = repository.create(payload as E);
    return repository.save(entity);
  }

  async softDeleteItem(entity: E, runner?: QueryRunner): Promise<E> {
    const manager = this.getEntityManager(runner);
    return manager.getRepository(this.entityTarget).softRemove(entity);
  }

  getPageSize(page = 1, size = 20): { take: number; skip: number } {
    const safePage = Math.max(1, page);
    const safeSize = Math.min(Math.max(1, size), 100);

    return {
      take: safeSize,
      skip: (safePage - 1) * safeSize,
    };
  }
}