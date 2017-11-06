# vue-upyun-image-format

## vue过滤器插件-又拍云图片格式化

[API documentation](https://lisfan.github.io/vue-upyun-image-format/)

## Feature 特性

- 根据DPR尺寸处理显示的图片大小

## Detail 详情

- 由于network information API支持力度差，所以需要外部的配合（比如是入口是微信或支付宝的，提供一个用户查询网络制式的方式）
 wifi使用dpr尺寸
 未知网络下使用dpr1
- 根据当前设计稿和设备物理分辨率缩放比，及设备dpr值，计算出实际的图片尺寸
- 使用的是又拍云图片服务。specs规格参数和附加规则参考又拍云 http://docs.upyun.com/cloud/image/#webp
- 图片尺寸值会四舍五入取整
- 图片尺寸的裁剪规则
  - 如果是wifi网络或者未知网络，统一使用当前设备dpr计算后的图片尺寸
  - 如果是4g网络，最大dpr值只取到dpr为3（可自定义），防止图片过大造成加载时间过久
- 使用格式： <img :src="图片地址 | image-size(size,[specs = 'both'],[rule])" />

## Install 安装

```bash
npm install -S @~lisfan/vue-upyun-image-format
```

## Usage 起步

``` js
import Vue from 'vue'
import VueUpyunImageFormat from '@~lisfan/vue-upyun-image-format'

// 注册指令
// 以下是默认值
Vue.use(VueUpyunImageFormat,{
    debug: false, // 关闭调试模式
})
```

```html
// 现有需求如下：
// 1. 当前设计稿件750px宽，物理分辨率350px，缩放比为2倍，当前dpr值是3，设计稿里的图片占位区域尺寸300x400
// 2. 此时尺寸的计算公式为，宽：300*3/(750/350)，高：400*3/(750/350)，最终尺寸为450x600
// 3. 原图片尺寸如果小于450时不进行放大，但如果图片尺寸大于450，则缩小到450
// 4. 在图片上加上水印'你好'

<img :image-src="coverUrl | image-size('300x300','fwfh','/watermark/text/5L2g5aW977yB')" />
<img :image-src="coverUrl | image-size('300x300','fwfh','/watermark/text/5L2g5aW977yB')" />
<img :image-src="coverUrl | image-size(null, null,'/watermark/text/5L2g5aW977yB')" />
<img :image-src="coverUrl | image-size('300x300','fwfh','/watermark/text/5L2g5aW977yB')" />
```


## 又拍云图片处理api的研究报告

**条件是建立在使用又拍云的图片处理服务，其他场景下结果会有不同**

### 静态图源（png/jpg/webp）的对比（ 同一图源，相同尺寸下 ）

1. 未使用压缩算法的情况下
- png > 无损webp > jpg > 有损webp

2. 使用压缩算法的情况下：压缩后的png比未压缩小64%，压缩jpg比未压缩小5%
- png > 无损webp > 压缩png > jpg > 压缩jpg > 有损webp

3. png使用了压缩算法后
- png -> png压缩算法，容量优化 64%

4. png转jpg，png转webp
- png -> jpg ,容量优化 70%
- png -> webp ,容量优化 95%

5. jpg转webp
- jpg -> webp ，容量优化 80%

6. jpg使用了压缩质量后
- jpg 90%的质量下，比源图容量优化35%
- jpg 80%的质量下，比源图容量优化62%

7. png 和 webp 相对 jpg的色彩饱和底比较：png和webp图片饱和底降低，灰阶提升，整体偏灰；jpg颜色饱满靓丽

8. webp格式压缩后，如果细看会有模糊感，jpg压缩质量90%情况下细节还原度还是挺高，压缩质量80%的情况下细节丢失度还是挺严重的，但总体还是比有员webp好

### 动态图源（gif/动态webp）的对比（ 同一图源，相同尺寸下 ）

w 314 23.4  267
1. 仅格式比较
- 无损webp > gif > 有损webp

2. gif转无损webp，gif转有损webp，
gif -> 无损webp，比源图容量增加18%
gif -> 有损webp，比源图容量增加62%

3. gif转换为有损webp，并没有明显的不适感

## 实行约定

由于使用压缩优化会导致模糊到清晰效果失效，所以默认对jpg图片不进行压缩优化

### 图片格式

- 根据浏览器对webp的支持力度及其他一些情况，用户上传的图片如果是非webp格式或jpg格式，如源图是png的，则会按照以下不同的场景转换成webp或jpg
	- (静态，支持webp，图片宽小于设备物理分辨率*dpr的2分之1时或小于200px*dpr时)，使用webp格式（又拍云api: `/format/webp`）
	- (静态，支持webp，图片宽大于设备物理分辨率*dpr的2分之1时且大于200px*dpr时)，使用jpg格式（又拍云api: `/format/jpg`）
	- (静态，不支持webp)，使用jpg格式（又拍云api: `/format/jpg`）
	- (动态，支持动态webp时)，使用webp格式（又拍云api: `/format/webp`）
	- (动态，不支持动态webp时)，使用gif格式，不作变动

- 当业务场景中需要使用原图尺寸时，内部也会调用压缩，除非明确指定不压缩

### 图片质量

- 指定为 jpg 格式时，默认不使用压缩算法，但会压缩质量到90%（又拍云api: `/quality/90`）
- 指定为 png 格式时，默认使用压缩算法 （又拍云api: `/compress/true`）
- 指定为 web 格式时，不作变动
- 指定为 gif 格式时，不作变动
- 当然你也可以自定义图片的质量

### 图片尺寸

若使用了原尺寸输出，则会使用压缩算法（compress/true）
默认宽度进行自适应，超出尺寸进行裁剪，若自定义尺寸大于原尺寸时，自动缩放至指定尺寸再裁剪（又拍云api: `/both/宽x高`）

当然你也可以自定义图片的尺寸