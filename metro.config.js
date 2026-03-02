const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase v9+ uses .mjs files. We need to tell Metro to resolve them.
config.resolver.sourceExts.push('mjs');

// Node-only modules that Supabase's ws package tries to import
const NODE_ONLY_MODULES = new Set(['ws', 'bufferutil', 'utf-8-validate', 'stream']);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (NODE_ONLY_MODULES.has(moduleName)) {
    return { type: 'empty' };
  }
  return originalResolveRequest 
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

