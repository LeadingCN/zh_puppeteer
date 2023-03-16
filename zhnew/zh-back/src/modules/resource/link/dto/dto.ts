export class AddLink{
  amount: number;
  channel: number;
  oid: string;
  pay_link:string;
  accountNumber:string;
  zuid:string;
}

export class Notify{
  merId: string;
  orderId: string;
  sysOrderId: string;
  orderAmt: string;
  desc: string;
  status: string;
  nonceStr:string
  attch: string;
}

export class NotifyResult{
  result: boolean;
  msg: string;
}

