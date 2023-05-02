import assert       from 'node:assert/strict';
import { test }     from 'node:test';
import { Worker }   from 'node:worker_threads';

void test
(
    'index',
    async (): Promise<void> =>
    {
        const exportedNames =
        await new Promise
        (
            (resolve, reject): void =>
            {
                const workerURL = new URL('./get-index-export-names-worker.ts', import.meta.url);
                let worker: Worker | null = new Worker(workerURL);
                worker.on
                (
                    'message',
                    (value): void =>
                    {
                        worker = null;
                        resolve(value);
                    },
                );
                worker.on
                (
                    'error',
                    (reason): void =>
                    {
                        worker = null;
                        reject(reason);
                    },
                );
                worker.on
                (
                    'exit',
                    (code): void =>
                    {
                        if (worker)
                        {
                            worker = null;
                            reject(`Worker stopped with exit code ${code}`);
                        }
                    },
                );
            },
        );
        assert.deepEqual
        (
            exportedNames,
            [
                'createBaseConfig',
                'createConfig',
                'createFlatConfig',
                'normalizeJSVersion',
                'normalizeTSVersion',
            ],
        );
    },
);
