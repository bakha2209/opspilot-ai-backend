import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { OrmRepository } from "../../core/typeorm/orm.repository";
import { UploadedFileEntity } from "../entity/uploaded-file.entity";

@Injectable()
export class UploadedFileRepository extends OrmRepository<UploadedFileEntity> {
  constructor(readonly dataSource: DataSource) {
    super(UploadedFileEntity, dataSource, 'UploadedFileRepository');
  }

  async findByCompanyId(companyId: string): Promise<UploadedFileEntity[]> {
    return this.findItemMany({
      where: { companyId },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
