const { ConfigFactory } = require('./engine/config')

const config = new ConfigFactory().loadInDirectory('./scripts')
console.log(config)

// const path = require('path')
//
// const kGlobalConfig = new Map([])
// // kGlobalConfig.set('node', 'production')
// kGlobalConfig.set('pass-args', true)
//
// const react = new Map([])
// react.set('REACT_APP_BASE_URL',  'example.com')
//
// const react_local = new Map([])
// react_local.set('REACT_APP_BASE_URL', 'localhost')
//
// const configuration = {
//   matrix: [
//     {
//       tag: 'react',
//       build_arguments: react
//     },
//     {
//       tag: 'react-local',
//       file: path.join(process.cwd(), './dockerfile.dev'),
//       build_arguments: react_local
//     }
//   ],
//   services: {
//     search: {
//       name: 'geo-search',
//       build_arguments: [
//         {
//           argument: 'REACT_APP_BASE_URL',
//           option: 'uri'
//         },
//         {
//           argument: 'NODE_ENV',
//           option: 'node'
//         }
//       ]
//     }
//   }
// }
//
// const configuration = {
//   services: {
//     search: {
//       name: 'geo-search',
//       build_arguments: [
//         {
//           argument: 'REACT_APP_BASE_URL',
//           option: 'uri'
//         }
//       ]
//     }
//   }
// }
//
// // console.log(JSON.stringify(configuration, null, 2))
//
// function Matrix (tag, config) {
//   this.tag = tag
//
//   this.build_arguments = config.build_arguments
//   this.file = config.file
// }
//
// const matrices = configuration.matrix?.map((matrix) => {
//   return new Matrix(matrix.tag, {
//     ...matrix
//   })
// })
//
// function DockerImage (build, name, config, matrix = null) {
//   this.build = build
//   this.name = name
//
//   this.dockerfile = path.join(process.cwd(), config.dockerfile || '.')
//   if ('file' in config || matrix?.file) {
//     this.dockerfile = null
//     this.file = matrix?.file || path.resolve(config.file)
//   }
//
//   this.buildArguments = []
//   if ('build_arguments' in config) {
//     this.buildArguments = config.build_arguments.map((argument) => {
//       return {
//         value: matrix?.build_arguments?.get(argument.argument) || kGlobalConfig.get(argument.option) || argument.default_value,
//         ...argument
//       }
//     })
//
//     if (!!kGlobalConfig.get('pass-args')) {
//       const missing = this.buildArguments.filter((arg) => !arg.value);
//       const error = new Error('Invalid build arguments')
//       error.code = 'EMISSINGARG'
//       error.underlyingError = missing.map((arg) => {
//         const error = new Error(`Pass --${arg.option} when running the command`)
//         delete error.stack
//         error.option = arg.option
//         error.env = arg.argument
//         return error
//       })
//
//       throw error
//     }
//   }
// }
//
// console.time('generate')
// process.setUncaughtExceptionCaptureCallback(console.error)
//
// process.on('exit', code => {
//   console.timeEnd('generate')
//   process.exit(code)
// })
//
// let images = []
// if (Object.keys(configuration.services).length === 1 && matrices?.length > 0) {
//   images.push(matrices.map((matrix) => {
//     const build = Object.keys(configuration.services)[0]
//     const config = configuration.services[build]
//     return new DockerImage(build, config.name, config, matrix)
//   }))
// } else if (Object.keys(configuration.services).length > 0) {
//   images.push(Object.keys(configuration.services).map((build) => {
//     const config = configuration.services[build]
//     return new DockerImage(build, config.name, config)
//   }))
// }
//
// images = images.flat()
// console.log(JSON.stringify(images, null, 2))
