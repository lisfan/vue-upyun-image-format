/**
 * 各种环境的设置
 * 针对：开发环境（debug环境），测试环境，生产环境，单元测式环境[暂定]，mock环境[暂定]
 * 应对一些需要缓存在客户端的数据
 *
 * @since 3.0.0
 * @version 1.0.0
 */

// 开发环境
export default JSON.parse(global.localStorage.getItem('IS_DEV')) || process.env.NODE_ENV === 'development'

// 测试环境
export const IS_TEST = process.env.NODE_ENV === 'test'

// 生产环境
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// 是否karma测试模式
// export const IS_KARMA = process.env.NODE_ENV === 'karma'
