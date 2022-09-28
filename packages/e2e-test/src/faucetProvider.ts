import { Address } from "@ckb-lumos/base";
import { GENESIS_CELL_PRIVATEKEYS } from "./constants";
import { asyncSleep, transferCKB, waitTransactionCommitted } from "./utils";
import { FaucetQueue, MockFaucetQueue } from "./faucetQueue";

interface ClaimTask {
  claimer: Address;
  amount: number;
  cb: (txHash: string) => unknown;
  error: (error: Error) => unknown;
}

export class FaucetProvider {
  private running = false;

  private queue: FaucetQueue;
  private claimQueue: ClaimTask[] = [];

  constructor(
    options: {
      queue?: FaucetQueue;
      genesisCellPks?: Array<string>;
    } = {}
  ) {
    const {
      queue = new MockFaucetQueue(),
      genesisCellPks = GENESIS_CELL_PRIVATEKEYS,
    } = options;
    this.queue = queue;
    this.queue.initialKeys(genesisCellPks);
    this.start();
  }

  private async getNext() {
    const task = this.claimQueue.shift();

    if (!task) {
      return undefined;
    }

    const idlePk = await this.queue.popIdleKey();

    return {
      privateKey: idlePk,
      task,
    };
  }

  async start(): Promise<void> {
    this.running = true;

    while (this.running) {
      const next = await this.getNext();
      if (!next) {
        await asyncSleep(1000);
        continue;
      }

      const txHash = await transferCKB({
        to: next.task.claimer,
        fromPk: next.privateKey,
        amount: next.task.amount,
      }).catch((err) => {
        next.task.error(err);
        throw err;
      });
      next.task.cb(txHash);

      waitTransactionCommitted(txHash).then(() => {
        this.queue.releaseKey(next.privateKey);
      });
    }
  }

  end(): void {
    this.running = false;
  }

  claimCKB(claimer: Address, amount?: number): Promise<string> {
    return new Promise((res, rej) => {
      this.claimQueue.push({
        claimer,
        amount: amount || 1000,
        cb: (txHash: string) => res(txHash),
        error: (error: Error) => rej(error),
      });
    });
  }
}
