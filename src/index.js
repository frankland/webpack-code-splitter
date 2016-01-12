import path from 'path';
const SEPARATOR = path.sep === '/' ? '\\x2f' : '\\x5c';

const getObjectValues = (source) => {
  let values = [];

  for (let key of Object.keys(source)) {
    let value = source[key];

    values.push(value);
  }

  return values;
};

export default class WebpackCodeSplitter {
  constructor(options) {
    this.buckets = [];

    for (let bucket of options) {
      let paths = null;

      if (Array.isArray(bucket.path)) {
        paths = bucket.path;
      } else {
        paths = [bucket.path];
      }

      this.buckets.push({
        name: bucket.name,
        path: paths.map(path => new RegExp(path.replace(/\//g, SEPARATOR)))
      });
    }
  }

  apply(compiler) {
    let match = (chunk) => {
      let match = null;
      this.buckets.some(bucket => {
        return bucket.path.some(path => {
          if (path.test(chunk.userRequest)) {
            match = bucket;
            return true;
          }
        });
      });

      return match;
    };

    compiler.plugin('compilation', compilation => {
      let splitedChunks = {};

      compilation.plugin('optimize-chunks', function(chunks) {
        let filtered = chunks.slice().filter(chunk => chunk.entry);

        let waitForRemove = [];

        for (let chunk of filtered) {
          for (let mod of chunk.modules) {
            let bucket = match(mod);
            if (bucket) {
              let newChunk = splitedChunks[bucket.name];
              if (!newChunk) {
                newChunk = this.addChunk(bucket.name);
                //newChunk.parents = [chunk];
                splitedChunks[bucket.name] = newChunk;
              }
              // add the module to the new chunk
              newChunk.addModule(mod);
              mod.addChunk(newChunk);

              // remove it from the existing chunk
              waitForRemove.push(mod);
            } else {

            }
          }

          for (let removeMod of waitForRemove) {
            chunk.removeModule(removeMod);
            removeMod.removeChunk(chunk);
          }
          /**
           *
           * Entry chunk
           * An entry chunk contains the runtime plus a bunch of modules.
           * If the chunk contains the module 0 the runtime executes it.
           * If not, it waits for chunks that contains the module 0 and executes it (every time when there is a chunk
           * with a module 0).
           *
           * Normal chunk
           * A normal chunk contains no runtime.
           * It only contains a bunch of modules.
           * The structure depends on the chunk loading algorithm.
           * I. e. for jsonp the modules are wrapped in a jsonp callback function. The chunk also contains a list of
           * chunk id that it fulfills.
           *
           * Initial chunk (non-entry)
           * An initial chunk is a normal chunk.
           * The only difference is that optimization treats it as more important because it counts toward the initial
           * loading time (like entry chunks). That chunk type can occur in combination with the CommonsChunkPlugin.
           */
          let all = getObjectValues(splitedChunks);
          all.push(chunk);

          let main = all.shift();
          //let main = chunk;

          main.entry = true;
          main.initial = true;
          main.chunks = all;

          for (let resultChunk of all) {
            //get the first chunk as a parent
            resultChunk.parents = [main];
            resultChunk.entry = false;
            resultChunk.initial = false;
          }
        }
      }, this);
    });
  }
}
