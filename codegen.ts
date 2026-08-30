import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: process.env.GRAPHQL_SCHEMA_URL ?? 'http://localhost:8080/graphql',
  documents: ['src/services/graphql/**/*.{graphql,ts}'],
  generates: {
    './src/graphql/generated/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
        scalars: {
          Decimal: 'number',
          Long: 'number',
          UnsignedInt: 'number',
          UUID: 'string',
          DateTime: 'string',
        },
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
