import { Processor ,Process } from '@nestjs/bull';
import { Job } from 'bull';
import { OrderTopService } from "@/modules/api/top/orderTop.service";
@Processor('order')
export class orderConsumer {
  constructor(
    private readonly orderTopService: OrderTopService,
  ) {
  }
  @Process('orderOutTime')
  async transcode(job: Job<unknown>) {
    await this.orderTopService.orderOuTtime(job)
    // console.log(`${job.id} create_at${new Date(job.timestamp)} handler_at ${new Date()} jobTime:${this.jobTime} `);
    //解锁zh的lockLimit

  }
}
