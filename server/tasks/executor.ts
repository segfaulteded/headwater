import {
  PROVIDER_STATUSES,
  type Provider,
  type ProviderStatus,
} from "../providers";

export default defineTask({
  meta: {
    name: "executor",
    description: "Run content download",
  },
  async run({ payload }) {
    const provider = payload.provider as Provider<never, never, never, never>;

    const status = provider.fetchStatus();

    const executions: { [key in ProviderStatus]: () => Promise<void> } = {
      init: provider.init,
      service: provider.runService,
      transport: provider.runTransport,
      processing: provider.runProcessing,
      finalizing: async () => {},
    };

    const toRun = PROVIDER_STATUSES.slice(PROVIDER_STATUSES.indexOf(status));
    for (const runStatus of toRun) {
      await executions[runStatus].call(provider);
    }

    return { result: true };
  },
});
