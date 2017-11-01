# logger

## 日志打印器

[API documentation](https://lisfan.github.io/logger/)

## Feature 特性

- 解决提交时因eslint提示console的语句无法通过问题
- 仅在开发环境打印日志，生产环境不打印日志

## Detail 详情

- 在console上包装了一层，支持console的所有的方法（包含部分非标准APi，但不包含未被废弃的API），部分API做了变化和新增加，未提及的保原效果不变，只是在原api上封装了一层进行代理运行，API使用方法可以参考[console API](https://developer.mozilla.org/en-US/docs/Web/API/Console/group)
  - 新增的isActivated、color、enable、disable方法
  - 调整error方法的作用：打印时会抛出错误，阻止脚本执行
  - 调整table方法的作用：如果数据非array或object类型，则使用this.log打印
- 若需要在生产环境下调式日志，可以更改或设置LS离线存储的值
   - localStorage设置`IS_DEV`为true
   - localStorage设置`LOGGER_RULES`配置命名空间规则
- 支持配置整个命名空间是否输出日志
- 支持配置命名空间下某个实例方法是否输出日志

## Install 安装

```bash
npm install -S @~lisfan/logger
```

## Usage 起步

``` js
import Logger from '@~lisfan/logger'

// 配置规则
Logger.configRules({
   request:true, // 该命名空间支持打印输出
   request.error:false, // 该命名空间下的error方法不支持打印输出
   response:false // 该命名空间不支持打印输出
})

const logger = new Logger() // 默认打印器，命名空间为`logger`
const loggerRequest = new Logger('request') // 创建命名空间为`request`的打印器
const loggerResponse = new Logger('response')

// 创建打印器，但关闭调试功能
const loggerDebug = new Logger({
   name: 'debug',
   debug: false
})

loggerRequest.log('请求url')    =>    [request]: 请求url
loggerRequest.error('请求url')    =>    // 无内容打印
loggerResponse.error('响应数据')    =>    // 无内容打印
loggerDebug.log('请求url')    =>     // 无内容打印
```


 *
 * 模块性质：vue 过滤器 插件
 * 作用范围：pc、mobile
 * 依赖模块：lodash，utils/logger
 * 来源项目：扫码点单H5
 * 初始发布日期：2017-05-24 20:00
 * 最后更新日期：2017-05-25 20:00
 *
 * ## 特性

 * - 由于network information API支持力度差，所以需要外部的配合（比如是入口是微信或支付宝的，提供一个用户查询网络制式的方式）
 wifi使用dpr尺寸
 未知网络下使用dpr1
 * - 根据当前设计稿和设备物理分辨率缩放比，及设备dpr值，计算出实际的图片尺寸
 * - 使用的是又拍云图片服务。specs规格参数和附加规则参考又拍云 http://docs.upyun.com/cloud/image/#webp
 * - 图片尺寸值会四舍五入取整
 * - 图片尺寸的裁剪规则
 *   - 如果是wifi网络或者未知网络，统一使用当前设备dpr计算后的图片尺寸
 *   - 如果是4g网络，最大dpr值只取到dpr为3（可自定义），防止图片过大造成加载时间过久
 * - 使用格式： <img :src="图片地址 | image-size(size,[specs = 'both'],[rule])" />
 *
 * ## Todo
 *
 * ## Changelog
 *
 * ## Usage
 *
 * // 现有需求如下：
 * // 1. 当前设计稿件750px宽，物理分辨率350px，缩放比为2倍，当前dpr值是3，设计稿里的图片占位区域尺寸300x400
 * // 2. 此时尺寸的计算公式为，宽：300*3/(750/350)，高：400*3/(750/350)，最终尺寸为450x600
 * // 3. 原图片尺寸如果小于450时不进行放大，但如果图片尺寸大于450，则缩小到450
 * // 4. 在图片上加上水印'你好'
 *
 * ```html
 *  <img :image-src="coverUrl | image-size('300x300','fwfh','/watermark/text/5L2g5aW977yB')" />
 * ```