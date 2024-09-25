import { pathToFileURL } from 'url';
import tsNode from 'ts-node';

tsNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'ESNext',
  },
});

const indexPath = './index.ts';
await import(pathToFileURL(indexPath).href);
